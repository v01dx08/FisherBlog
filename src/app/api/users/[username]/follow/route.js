import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { error, handleRouteError, json } from "@/lib/http"
import { assertSameOrigin, normalizeIdentity } from "@/lib/security"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request)
    const actor = await requireUser(request)
    await enforceRateLimit(request, { scope: "users.follow", actorId: actor.id, limit: 120, windowMs: 5 * 60 * 1000 })
    const { username } = await params
    const target = await db.user.findUnique({
      where: { usernameNormalized: normalizeIdentity(username) },
      select: { id: true, status: true, notifyInteractions: true },
    })
    if (!target || target.status !== "ACTIVE") return error("Không tìm thấy người dùng", 404)
    if (target.id === actor.id) return error("Không thể tự theo dõi chính mình", 400)

    const existing = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: actor.id, followingId: target.id } },
    })
    const isFollowing = !existing

    await db.$transaction(async (tx) => {
      if (existing) {
        await tx.follow.delete({ where: { id: existing.id } })
        await tx.notification.deleteMany({
          where: { userId: target.id, actorId: actor.id, type: "follow" },
        })
      } else {
        await tx.follow.create({ data: { followerId: actor.id, followingId: target.id } })
        if (target.notifyInteractions) {
          await tx.notification.create({
            data: {
              userId: target.id,
              type: "follow",
              actorId: actor.id,
              content: `${actor.displayName || actor.username} đã bắt đầu theo dõi bạn.`,
            },
          })
        }
      }
    })

    const followerCount = await db.follow.count({ where: { followingId: target.id } })
    return json({ isFollowing, followerCount })
  } catch (caught) {
    return handleRouteError("users.follow", caught, request)
  }
}
