import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { assertSameOrigin } from "@/lib/security"
import { error, handleRouteError, json, readJson, RequestError } from "@/lib/http"
import { validatePublicationInput } from "@/lib/publications"

async function requirePostManager(postId, user) {
  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true, proofIssuedAt: true } })
  if (!post) throw new RequestError("Không tìm thấy bài viết", 404)
  if (post.authorId !== user.id && user.role !== "ADMIN") {
    throw new RequestError("Bạn không có quyền cập nhật liên kết phát hành", 403)
  }
  return post
}

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request)
    const { id } = await params
    const user = await requireUser(request)
    const input = validatePublicationInput(await readJson(request, 8_192))
    const post = await requirePostManager(id, user)
    if (input.publishedAt && input.publishedAt < post.proofIssuedAt) {
      throw new RequestError("Thời điểm phát hành không thể trước bản ghi gốc FishViet", 400)
    }

    const publication = await db.$transaction(async (tx) => {
      const created = await tx.postPublication.create({ data: { postId: id, ...input } })
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "post.publication.add",
          target: id,
          metadata: { publicationId: created.id, platform: created.platform, url: created.url },
        },
      })
      return created
    })

    return json(publication, 201)
  } catch (caught) {
    return handleRouteError("posts.publications.add", caught)
  }
}

export async function DELETE(request, { params }) {
  try {
    assertSameOrigin(request)
    const { id } = await params
    const user = await requireUser(request)
    const { publicationId } = await readJson(request, 4_096)
    await requirePostManager(id, user)

    const publication = await db.postPublication.findFirst({
      where: { id: String(publicationId || ""), postId: id },
    })
    if (!publication) return error("Không tìm thấy liên kết phát hành", 404)

    await db.$transaction([
      db.postPublication.delete({ where: { id: publication.id } }),
      db.auditLog.create({
        data: {
          actorId: user.id,
          action: "post.publication.delete",
          target: id,
          metadata: { publicationId: publication.id, platform: publication.platform, url: publication.url },
        },
      }),
    ])

    return json({ success: true })
  } catch (caught) {
    return handleRouteError("posts.publications.delete", caught)
  }
}
