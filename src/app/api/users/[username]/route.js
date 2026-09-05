import { db } from "@/lib/db"
import { getCurrentUser, requireUser } from "@/lib/auth"
import { error, handleRouteError, json, readJson, RequestError } from "@/lib/http"
import { serializePost } from "@/lib/posts"
import { assertSameOrigin, normalizeIdentity, optionalText, validateHttpUrl } from "@/lib/security"
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
    const { username } = await params
    const currentUser = await getCurrentUser(request)
    const user = await db.user.findFirst({
      where: {
        status: "ACTIVE",
        OR: [{ usernameNormalized: normalizeIdentity(username) }, { id: username }],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        fishingStyle: true,
        youtubeUrl: true,
        tiktokUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        role: true,
        createdAt: true,
        isProfileCompleted: true,
        hideLocation: true,
        _count: { select: { posts: true, comments: true, followers: true, following: true } },
        posts: {
          where:
            currentUser?.role === "ADMIN"
              ? undefined
              : currentUser
                ? { OR: [{ visibility: "PUBLIC" }, { authorId: currentUser.id }] }
                : { visibility: "PUBLIC" },
          include: {
            author: { select: authorSelect },
            comments: {
              include: { author: { select: authorSelect } },
              orderBy: { createdAt: "asc" },
              take: 20,
            },
            likes: currentUser
              ? { where: { userId: currentUser.id }, select: { userId: true } }
              : false,
            bookmarks: currentUser
              ? { where: { userId: currentUser.id }, select: { userId: true } }
              : false,
            _count: { select: { likes: true, comments: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
      },
    })

    if (!user) return error("Không tìm thấy người dùng", 404)

    const isFollowing = currentUser
      ? Boolean(
          await db.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUser.id,
                followingId: user.id,
              },
            },
            select: { id: true },
          })
        )
      : false

    return json({
      ...user,
      location:
        user.hideLocation && currentUser?.id !== user.id && currentUser?.role !== "ADMIN"
          ? null
          : user.location,
      hideLocation: undefined,
      isFollowing,
      posts: user.posts.map((post) => serializePost(post, currentUser?.id)),
    })
  } catch (caught) {
    return handleRouteError("users.profile", caught, request)
  }
}

export async function PUT(request, { params }) {
  try {
    assertSameOrigin(request)
    const { username } = await params
    const actor = await requireUser(request)
    await enforceRateLimit(request, { scope: "users.update", actorId: actor.id, limit: 30, windowMs: 60 * 60 * 1000 })
    const target = await db.user.findFirst({
      where: { OR: [{ usernameNormalized: normalizeIdentity(username) }, { id: username }] },
    })
    if (!target) return error("Không tìm thấy người dùng", 404)
    if (target.id !== actor.id && actor.role !== "ADMIN") {
      throw new RequestError("Không có quyền chỉnh sửa hồ sơ này", 403)
    }

    const body = await readJson(request, 24_576)
    const data = {
      displayName: optionalText(body.displayName, { name: "Tên hiển thị", max: 80 }),
      avatarUrl: validateHttpUrl(body.avatarUrl, "Ảnh đại diện"),
      bio: optionalText(body.bio, { name: "Tiểu sử", max: 500 }),
      location: optionalText(body.location, { name: "Địa điểm", max: 120 }),
      fishingStyle: optionalText(body.fishingStyle, { name: "Sở trường", max: 120 }),
      youtubeUrl: validateHttpUrl(body.youtubeUrl, "YouTube"),
      tiktokUrl: validateHttpUrl(body.tiktokUrl, "TikTok"),
      facebookUrl: validateHttpUrl(body.facebookUrl, "Facebook"),
      instagramUrl: validateHttpUrl(body.instagramUrl, "Instagram"),
      isProfileCompleted: true,
    }

    const updated = await db.user.update({
      where: { id: target.id },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        fishingStyle: true,
        youtubeUrl: true,
        tiktokUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        role: true,
        isProfileCompleted: true,
      },
    })
    return json(updated)
  } catch (caught) {
    return handleRouteError("users.update", caught, request)
  }
}
