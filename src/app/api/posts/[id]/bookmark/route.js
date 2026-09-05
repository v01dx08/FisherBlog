import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { error, handleRouteError, json } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request)
    const { id } = await params
    const user = await requireUser(request)
    await enforceRateLimit(request, { scope: "posts.bookmark", actorId: user.id, limit: 120, windowMs: 5 * 60 * 1000 })
    const post = await db.post.findUnique({ where: { id }, select: { visibility: true } })
    if (!post || post.visibility !== "PUBLIC") return error("Không tìm thấy bài viết", 404)

    const existing = await db.bookmark.findUnique({
      where: { postId_userId: { postId: id, userId: user.id } },
    })

    if (existing) await db.bookmark.delete({ where: { id: existing.id } })
    else await db.bookmark.create({ data: { postId: id, userId: user.id } })

    return json({ bookmarked: !existing })
  } catch (caught) {
    return handleRouteError("posts.bookmark", caught, request)
  }
}
