import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { error, handleRouteError, json, readJson } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"

const MESSAGE_RECALLED = "FISHVIET_RECALLED"
const MESSAGE_RECALLED_PREFIX = `${MESSAGE_RECALLED}:`
const messageSenderSelect = { id: true, username: true, displayName: true, avatarUrl: true }
const messageInclude = {
  sender: { select: messageSenderSelect },
  pin: {
    select: {
      createdAt: true,
      pinnedBy: { select: messageSenderSelect },
    },
  },
}

function serializeMessage(message) {
  if (!message) return null
  const { pin, ...rest } = message
  return {
    ...rest,
    isPinned: Boolean(pin),
    pinnedAt: pin?.createdAt || null,
    pinnedBy: pin?.pinnedBy || null,
  }
}

export async function GET(request, { params }) {
  try {
    const { conversationId } = await params
    const user = await requireUser(request)
    const participant = await db.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    })
    if (!participant) return error("Khong co quyen truy cap", 403)

    const [messages] = await db.$transaction([
      db.message.findMany({
        where: { conversationId },
        include: messageInclude,
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

    return json(messages.map(serializeMessage))
  } catch (caught) {
    return handleRouteError("messages.detail", caught, request)
  }
}

export async function PATCH(request, { params }) {
  try {
    assertSameOrigin(request)
    const { conversationId } = await params
    const user = await requireUser(request)
    const body = await readJson(request, 2_048)
    const action = String(body.action || "")
    const messageId = String(body.messageId || "")
    if (!["recall", "pin", "unpin"].includes(action) || !messageId) {
      return error("Yeu cau khong hop le", 400)
    }

    const participant = await db.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    })
    if (!participant) return error("Khong co quyen truy cap", 403)

    const message = await db.message.findFirst({
      where: { id: messageId, conversationId },
      select: { id: true, senderId: true, content: true },
    })
    if (!message) return error("Khong tim thay tin nhan", 404)
    if ((message.content === MESSAGE_RECALLED || message.content.startsWith(MESSAGE_RECALLED_PREFIX)) && action !== "unpin") {
      return error("Tin nhan da duoc thu hoi", 400)
    }

    if (action === "pin") {
      await db.messagePin.upsert({
        where: { messageId },
        update: { pinnedById: user.id },
        create: { conversationId, messageId, pinnedById: user.id },
      })
      const updated = await db.message.findUnique({ where: { id: messageId }, include: messageInclude })
      return json(serializeMessage(updated))
    }

    if (action === "unpin") {
      await db.messagePin.deleteMany({ where: { messageId, conversationId } })
      const updated = await db.message.findUnique({ where: { id: messageId }, include: messageInclude })
      return json(serializeMessage(updated))
    }

    if (message.senderId !== user.id) return error("Chi co the thu hoi tin nhan cua ban", 403)

    const updated = await db.message.update({
      where: { id: messageId },
      data: {
        content: `${MESSAGE_RECALLED_PREFIX}${JSON.stringify({
          recalledById: user.id,
          recalledByName: user.displayName || user.username,
        })}`,
      },
      include: messageInclude,
    })
    await db.messagePin.deleteMany({ where: { messageId, conversationId } })
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return json(serializeMessage(updated))
  } catch (caught) {
    return handleRouteError("messages.patch", caught, request)
  }
}
