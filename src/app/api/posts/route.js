import { db } from "@/lib/db"
import { getCurrentUser, requireUser } from "@/lib/auth"
import { handleRouteError, json, readJson, RequestError } from "@/lib/http"
import { assertSameOrigin, clampLimit, cleanText, optionalText, validateHttpUrl } from "@/lib/security"
import { createPostProofPayload, hashPostProofPayload, serializePost } from "@/lib/posts"
import { enforceRateLimit } from "@/lib/rate-limit"
import { feedAuthorSelect, feedCommentInclude, getPostFeed } from "@/lib/feed"

function localUploadFilename(value) {
  if (!value) return null
  try {
    const pathname = new URL(value, "http://local").pathname
    return /^\/api\/uploads\/([a-f0-9-]{36}\.(?:jpg|png|webp|gif|mp4|webm))$/.exec(pathname)?.[1] || null
  } catch {
    return null
  }
}

function validateMediaUrlList(value, name) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 10).map((url, index) => validateHttpUrl(url, `${name} ${index + 1}`)).filter(Boolean)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get("tag")?.trim()
    const query = searchParams.get("q")?.trim()
    const saved = searchParams.get("saved") === "true"
    const cursor = searchParams.get("cursor")
    const limit = clampLimit(searchParams.get("limit"), 12, 30)
    const currentUser = await getCurrentUser(request)

    return json(await getPostFeed({ tag, query, saved, cursor, limit, currentUser }))
  } catch (caught) {
    return handleRouteError("posts.list", caught, request)
  }
}

export async function POST(request) {
  try {
    assertSameOrigin(request)
    const author = await requireUser(request)
    await enforceRateLimit(request, { scope: "posts.create", actorId: author.id, limit: 30, windowMs: 60 * 60 * 1000 })
    const body = await readJson(request)
    const content = cleanText(body.content, { name: "Nội dung bài viết", min: 3, max: 3_000 })
    const imageUrls = validateMediaUrlList(body.imageUrls, "Đường dẫn ảnh")
    const fallbackImageUrl = imageUrls.length ? null : validateHttpUrl(body.imageUrl, "Đường dẫn ảnh")
    const imageUrl = imageUrls.length > 1
      ? JSON.stringify(imageUrls)
      : imageUrls[0] || fallbackImageUrl
    const videoUrl = validateHttpUrl(body.videoUrl, "Đường dẫn video")
    const species = optionalText(body.species, { name: "Loài cá", max: 80 })
    const spotName = optionalText(body.spotName, { name: "Điểm câu", max: 120 })
    const visibility = ["PUBLIC", "UNLISTED", "PRIVATE"].includes(body.visibility)
      ? body.visibility
      : "PUBLIC"
    const weightKg = body.weightKg === "" || body.weightKg == null ? null : Number(body.weightKg)

    if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 1_000)) {
      throw new RequestError("Cân nặng cá không hợp lệ", 400)
    }

    const createdAt = new Date()
    const filenames = [...new Set([
      ...imageUrls.map(localUploadFilename),
      localUploadFilename(fallbackImageUrl),
      localUploadFilename(videoUrl),
    ].filter(Boolean))]
    const post = await db.$transaction(async (tx) => {
      const media = filenames.length
        ? await tx.mediaAsset.findMany({
            where: { filename: { in: filenames }, ownerId: author.id, postId: null },
            select: { filename: true, mimeType: true, size: true, sha256: true },
          })
        : []
      if (media.length !== filenames.length) throw new RequestError("Tệp tải lên không hợp lệ", 400)

      const proofPayload = createPostProofPayload({
        authorId: author.id,
        content,
        imageUrl,
        videoUrl,
        media,
        species,
        weightKg,
        spotName,
        visibility,
        createdAt,
      })
      const created = await tx.post.create({
        data: {
          content,
          imageUrl,
          videoUrl,
          species,
          weightKg,
          spotName,
          visibility,
          authorId: author.id,
          createdAt,
          proofIssuedAt: createdAt,
          proofHash: hashPostProofPayload(proofPayload),
          proofVersion: 2,
          proofPayload,
        },
        include: {
          author: { select: feedAuthorSelect },
          comments: { include: feedCommentInclude },
          likes: { select: { userId: true } },
          bookmarks: { select: { userId: true } },
          _count: { select: { likes: true, comments: true } },
        },
      })
      if (filenames.length) {
        const attached = await tx.mediaAsset.updateMany({
          where: { filename: { in: filenames }, ownerId: author.id, postId: null },
          data: { postId: created.id },
        })
        if (attached.count !== filenames.length) throw new RequestError("Tệp tải lên không hợp lệ", 400)
      }
      return created
    })

    return json(serializePost(post, author.id), 201)
  } catch (caught) {
    return handleRouteError("posts.create", caught, request)
  }
}
