import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { error, handleRouteError, json } from "@/lib/http"

export async function GET(request, { params }) {
  try {
    const { conversationId } = await params
    const user = await requireUser(request)
    const participant = await db.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    })
    if (!participant) return error("Không có quyền truy cập", 403)

    const [messages] = await db.$transaction([
      db.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 200,
      }),
      db.message.updateMany({
        where: {
          conversationId,
          isRead: false,
          senderId: { not: user.id },
        },
        data: { isRead: true },
      }),
    ])

    return json(messages)
  } catch (caught) {
    return handleRouteError("messages.detail", caught)
  }
}
