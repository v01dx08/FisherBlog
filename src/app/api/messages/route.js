import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { error, handleRouteError, json, readJson } from "@/lib/http"
import { assertSameOrigin, cleanText, validateUsername } from "@/lib/security"

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
}

export async function GET(request) {
  try {
    const user = await requireUser(request)
    const conversations = await db.conversation.findMany({
      where: { participants: { some: { userId: user.id } } },
      include: {
        participants: { include: { user: { select: userSelect } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { username: true, displayName: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    })

    const items = await Promise.all(
      conversations.map(async (conversation) => {
        const unread = await db.message.count({
          where: {
            conversationId: conversation.id,
            isRead: false,
            senderId: { not: user.id },
          },
        })
        const otherUser = conversation.participants.find((item) => item.userId !== user.id)?.user
        const lastMessage = conversation.messages[0]
        return {
          id: conversation.id,
          otherUser: otherUser || { username: "unknown", displayName: "Không rõ" },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                senderName: lastMessage.sender.displayName || lastMessage.sender.username,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unread,
          updatedAt: conversation.updatedAt,
        }
      })
    )

    return json(items)
  } catch (caught) {
    return handleRouteError("messages.list", caught)
  }
}

export async function POST(request) {
  try {
    assertSameOrigin(request)
    const user = await requireUser(request)
    const body = await readJson(request, 8_192)
    const content = cleanText(body.content, { name: "Tin nhắn", min: 1, max: 2_000 })
    let conversationId = body.conversationId ? String(body.conversationId) : null

    if (conversationId) {
      const participant = await db.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId: user.id } },
      })
      if (!participant) return error("Không có quyền truy cập cuộc trò chuyện", 403)
    } else {
      const recipientUsername = validateUsername(body.recipientUsername)
      const recipient = await db.user.findUnique({
        where: { usernameNormalized: recipientUsername.toLowerCase() },
        select: { id: true, status: true },
      })
      if (!recipient || recipient.status !== "ACTIVE") return error("Không tìm thấy người nhận", 404)
      if (recipient.id === user.id) return error("Không thể tự gửi tin nhắn cho chính mình", 400)

      const existing = await db.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: user.id } } },
            { participants: { some: { userId: recipient.id } } },
            { participants: { every: { userId: { in: [user.id, recipient.id] } } } },
          ],
        },
        select: { id: true },
      })

      if (existing) conversationId = existing.id
      else {
        const conversation = await db.conversation.create({
          data: {
            participants: { create: [{ userId: user.id }, { userId: recipient.id }] },
          },
          select: { id: true },
        })
        conversationId = conversation.id
      }
    }

    const message = await db.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId, senderId: user.id, content },
        include: { sender: { select: userSelect } },
      })
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })
      return created
    })

    return json(message, 201)
  } catch (caught) {
    return handleRouteError("messages.send", caught)
  }
}
