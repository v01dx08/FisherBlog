import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { handleRouteError, json } from "@/lib/http"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request) {
  try {
    const actor = await requireUser(request)
    await enforceRateLimit(request, { scope: "account.export", actorId: actor.id, limit: 5, windowMs: 60 * 60 * 1000 })
    const user = await db.user.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        fishingStyle: true,
        youtubeUrl: true,
        tiktokUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        hideLocation: true,
        notifyInteractions: true,
        createdAt: true,
        posts: { include: { publications: true, mediaAssets: { select: { filename: true, mimeType: true, size: true, sha256: true } } } },
        comments: true,
        likes: true,
        bookmarks: true,
        following: true,
        followers: true,
        sentMessages: true,
        auditLogs: true,
      },
    })

    return json({ exportedAt: new Date().toISOString(), user }, 200, {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="fishviet-${actor.username}-data.json"`,
    })
  } catch (caught) {
    return handleRouteError("account.export", caught, request)
  }
}
