import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { error, handleRouteError, json, readJson } from "@/lib/http"
import { assertSameOrigin, cleanText } from "@/lib/security"
import { enforceRateLimit } from "@/lib/rate-limit"

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  role: true,
  avatarUrl: true,
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const comments = await db.comment.findMany({
      where: { postId: id, post: { visibility: "PUBLIC" } },
      include: { author: { select: authorSelect } },
      orderBy: { createdAt: "asc" },
      take: 100,
    })
    return json(comments)
  } catch (caught) {
    return handleRouteError("comments.list", caught, request)
  }
}

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request)
    const { id } = await params
    const user = await requireUser(request)
    await enforceRateLimit(request, { scope: "comments.create", actorId: user.id, limit: 60, windowMs: 10 * 60 * 1000 })
    const { content: rawContent } = await readJson(request, 8_192)
    const content = cleanText(rawContent, { name: "Bình luận", min: 1, max: 1_000 })
    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true, visibility: true, author: { select: { notifyInteractions: true } } },
    })
    if (!post || post.visibility !== "PUBLIC") return error("Không tìm thấy bài viết", 404)

    const comment = await db.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: { content, postId: id, authorId: user.id },
        include: { author: { select: authorSelect } },
      })

      if (post.authorId !== user.id && post.author.notifyInteractions) {
        const actorName = user.displayName || user.username
        const snippet = content.length > 80 ? `${content.slice(0, 80)}…` : content
        await tx.notification.create({
          data: {
            userId: post.authorId,
            type: "comment",
            actorId: user.id,
            postId: id,
            content: `${actorName} đã bình luận: “${snippet}”`,
          },
        })
      }
      return created
    })

    return json(comment, 201)
  } catch (caught) {
    return handleRouteError("comments.create", caught, request)
  }
}
