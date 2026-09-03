import { db } from "@/lib/db"
import { getCurrentUser, requireUser } from "@/lib/auth"
import { handleRouteError, json, readJson, RequestError } from "@/lib/http"
import { assertSameOrigin, clampLimit, cleanText, optionalText, validateHttpUrl } from "@/lib/security"
import { createPostProof, serializePost } from "@/lib/posts"

function localUploadFilename(value) {
  if (!value) return null
  try {
    const pathname = new URL(value, "http://local").pathname
    return /^\/api\/uploads\/([a-f0-9-]{36}\.(?:jpg|png|webp|gif|mp4|webm))$/.exec(pathname)?.[1] || null
  } catch {
    return null
  }
}

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
}

const commentInclude = {
  author: { select: authorSelect },
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

    const where = {
      visibility: "PUBLIC",
      ...(tag ? { content: { contains: tag.startsWith("#") ? tag : `#${tag}`, mode: "insensitive" } } : {}),
      ...(query
        ? {
            OR: [
              { content: { contains: query, mode: "insensitive" } },
              { species: { contains: query, mode: "insensitive" } },
              { spotName: { contains: query, mode: "insensitive" } },
              { author: { username: { contains: query, mode: "insensitive" } } },
              { author: { displayName: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(saved && currentUser ? { bookmarks: { some: { userId: currentUser.id } } } : {}),
    }

    if (saved && !currentUser) return json({ items: [], nextCursor: null })

    const posts = await db.post.findMany({
      where,
      include: {
        author: { select: authorSelect },
        comments: {
          include: commentInclude,
          orderBy: { createdAt: "asc" },
          take: 20,
        },
        likes: currentUser ? { where: { userId: currentUser.id }, select: { userId: true } } : false,
        bookmarks: currentUser
          ? { where: { userId: currentUser.id }, select: { userId: true } }
          : false,
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = posts.length > limit
    const page = hasMore ? posts.slice(0, limit) : posts
    return json({
      items: page.map((post) => serializePost(post, currentUser?.id)),
      nextCursor: hasMore ? page.at(-1)?.id : null,
    })
  } catch (caught) {
    return handleRouteError("posts.list", caught)
  }
}

export async function POST(request) {
  try {
    assertSameOrigin(request)
    const author = await requireUser(request)
    const body = await readJson(request)
    const content = cleanText(body.content, { name: "Nội dung bài viết", min: 3, max: 3_000 })
    const imageUrl = validateHttpUrl(body.imageUrl, "Đường dẫn ảnh")
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
    const filenames = [localUploadFilename(imageUrl), localUploadFilename(videoUrl)].filter(Boolean)
    const post = await db.$transaction(async (tx) => {
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
          proofHash: createPostProof({ authorId: author.id, content, imageUrl, videoUrl, createdAt }),
        },
        include: {
          author: { select: authorSelect },
          comments: { include: commentInclude },
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
    return handleRouteError("posts.create", caught)
  }
}
