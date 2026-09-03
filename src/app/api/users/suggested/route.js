import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { handleRouteError, json } from "@/lib/http"

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request)
    const users = await db.user.findMany({
      where: {
        status: "ACTIVE",
        role: "INFLUENCER",
        isProfileCompleted: true,
        ...(currentUser ? { id: { not: currentUser.id } } : {}),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        fishingStyle: true,
        _count: { select: { posts: true, followers: true } },
      },
      orderBy: [{ followers: { _count: "desc" } }, { createdAt: "asc" }],
      take: 6,
    })

    const followedIds = currentUser
      ? new Set(
          (
            await db.follow.findMany({
              where: { followerId: currentUser.id, followingId: { in: users.map((user) => user.id) } },
              select: { followingId: true },
            })
          ).map((follow) => follow.followingId)
        )
      : new Set()

    return json(
      users.map((user) => ({
        username: user.username,
        name: user.displayName || user.username,
        avatarUrl: user.avatarUrl,
        specialty: user.fishingStyle || "Cần thủ",
        followers: user._count.followers,
        posts: user._count.posts,
        isFollowing: followedIds.has(user.id),
      }))
    )
  } catch (caught) {
    return handleRouteError("users.suggested", caught)
  }
}
