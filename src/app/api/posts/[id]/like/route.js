import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { error, handleRouteError, json } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request)
    const { id } = await params
    const user = await requireUser(request)
    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true, visibility: true, author: { select: { notifyInteractions: true } } },
    })
    if (!post || post.visibility !== "PUBLIC") return error("Không tìm thấy bài viết", 404)

    const existing = await db.like.findUnique({
      where: { postId_userId: { postId: id, userId: user.id } },
    })

    const liked = !existing
    await db.$transaction(async (tx) => {
      if (existing) {
        await tx.like.delete({ where: { id: existing.id } })
        await tx.notification.deleteMany({
          where: { userId: post.authorId, actorId: user.id, postId: id, type: "like" },
        })
      } else {
        await tx.like.create({ data: { postId: id, userId: user.id } })
        if (post.authorId !== user.id && post.author.notifyInteractions) {
          const actorName = user.displayName || user.username
          await tx.notification.create({
            data: {
              userId: post.authorId,
              type: "like",
              actorId: user.id,
              postId: id,
              content: `${actorName} đã thả tim nhật ký của bạn.`,
            },
          })
        }
      }
    })

    const likeCount = await db.like.count({ where: { postId: id } })
    return json({ liked, likeCount })
  } catch (caught) {
    return handleRouteError("posts.like", caught)
  }
}
