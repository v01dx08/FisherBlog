import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { handleRouteError, json } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"

export async function GET(request) {
  try {
    const user = await requireUser(request)
    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        include: {
          actor: { select: { username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      db.notification.count({ where: { userId: user.id, isRead: false } }),
    ])
    return json({ notifications, unreadCount })
  } catch (caught) {
    return handleRouteError("notifications.list", caught)
  }
}

export async function PATCH(request) {
  try {
    assertSameOrigin(request)
    const user = await requireUser(request)
    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    })
    return json({ success: true })
  } catch (caught) {
    return handleRouteError("notifications.read", caught)
  }
}
