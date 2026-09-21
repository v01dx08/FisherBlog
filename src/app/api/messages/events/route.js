import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { handleRouteError } from "@/lib/http"
import { requireConversationParticipant, callUserSelect } from "@/lib/calls"
import { getTypingUsers } from "@/lib/message-typing"
import { getPresence } from "@/lib/user-presence"

const encoder = new TextEncoder()
const POLL_INTERVAL_MS = 700
const CALL_MESSAGE_PREFIX = "FISHVIET_CALL:"
const STREAM_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "Connection": "keep-alive",
  "X-Accel-Buffering": "no",
}

const messageUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
}
const messageInclude = {
  sender: { select: messageUserSelect },
  pin: {
    select: {
      createdAt: true,
      pinnedBy: { select: messageUserSelect },
    },
  },
}

function serializeMessage(message) {
  const { pin, ...rest } = message
  return {
    ...rest,
    isPinned: Boolean(pin),
    pinnedAt: pin?.createdAt || null,
    pinnedBy: pin?.pinnedBy || null,
  }
}

function eventChunk(event, data) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function pingChunk() {
  return encoder.encode(`: ping ${Date.now()}\n\n`)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function latestDate(items, key, fallback) {
  return items.reduce((latest, item) => {
    const next = new Date(item[key])
    return next > latest ? next : latest
  }, fallback)
}

export async function GET(request) {
  try {
    const user = await requireUser(request)
    const url = new URL(request.url)
    const conversationId = String(url.searchParams.get("conversationId") || "")
    let otherParticipant = null
    if (conversationId) {
      await requireConversationParticipant(conversationId, user.id)
      otherParticipant = await db.conversationParticipant.findFirst({
        where: { conversationId, userId: { not: user.id } },
        include: { user: { select: messageUserSelect } },
      })
    }

    let lastMessageAt = new Date(Date.now() - 5_000)
    let lastCallAt = new Date(Date.now() - 5_000)
    let lastSignalAt = new Date(Date.now() - 5_000)
    const messageContentById = new Map()
    let lastTypingPayload = ""
    let lastPresencePayload = ""
    let closed = false
    request.signal.addEventListener("abort", () => {
      closed = true
    })

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(eventChunk("ready", { conversationId: conversationId || null }))
        let lastPingAt = Date.now()

        while (!closed) {
          try {
            const [messages, recentMessages, calls, signals] = await Promise.all([
              conversationId
                ? db.message.findMany({
                    where: {
                      conversationId,
                      OR: [
                        { senderId: { not: user.id } },
                        { content: { startsWith: CALL_MESSAGE_PREFIX } },
                      ],
                      createdAt: { gt: lastMessageAt },
                    },
                    include: messageInclude,
                    orderBy: { createdAt: "asc" },
                    take: 50,
                  })
                : [],
              conversationId
                ? db.message.findMany({
                    where: { conversationId },
                    include: messageInclude,
                    orderBy: { createdAt: "desc" },
                    take: 100,
                  })
                : [],
              db.callSession.findMany({
                where: {
                  ...(conversationId
                    ? { conversationId }
                    : { conversation: { participants: { some: { userId: user.id } } } }),
                  updatedAt: { gt: lastCallAt },
                },
                include: { caller: { select: callUserSelect } },
                orderBy: { updatedAt: "asc" },
                take: 20,
              }),
              conversationId
                ? db.callSignal.findMany({
                    where: {
                      senderId: { not: user.id },
                      session: { conversationId },
                      createdAt: { gte: lastSignalAt },
                    },
                    orderBy: { createdAt: "asc" },
                    take: 100,
                  })
                : [],
            ])

            messages.forEach((message) => {
              const serialized = serializeMessage(message)
              messageContentById.set(message.id, JSON.stringify({ content: serialized.content, isPinned: serialized.isPinned, pinnedAt: serialized.pinnedAt }))
              controller.enqueue(eventChunk("message", serialized))
            })
            recentMessages.forEach((message) => {
              const serialized = serializeMessage(message)
              const currentPayload = JSON.stringify({ content: serialized.content, isPinned: serialized.isPinned, pinnedAt: serialized.pinnedAt })
              const previousContent = messageContentById.get(message.id)
              if (previousContent === undefined) {
                messageContentById.set(message.id, currentPayload)
                return
              }
              if (previousContent !== currentPayload) {
                messageContentById.set(message.id, currentPayload)
                controller.enqueue(eventChunk("message-update", serialized))
              }
            })
            calls.forEach((call) => controller.enqueue(eventChunk("call", call)))
            signals.forEach((signal) => controller.enqueue(eventChunk("signal", signal)))

            if (conversationId) {
              const typingUsers = getTypingUsers(conversationId, user.id)
              const typingPayload = JSON.stringify(typingUsers.map((item) => item.userId).sort())
              if (typingPayload !== lastTypingPayload) {
                controller.enqueue(eventChunk("typing", { users: typingUsers }))
                lastTypingPayload = typingPayload
              }
            }

            if (otherParticipant?.user) {
              const presenceUser = {
                ...otherParticipant.user,
                ...getPresence(otherParticipant.user.id),
              }
              const presencePayload = JSON.stringify({
                id: presenceUser.id,
                isOnline: presenceUser.isOnline,
                lastSeenAt: presenceUser.lastSeenAt,
              })
              if (presencePayload !== lastPresencePayload) {
                controller.enqueue(eventChunk("presence", { user: presenceUser }))
                lastPresencePayload = presencePayload
              }
            }

            if (messages.length) lastMessageAt = latestDate(messages, "createdAt", lastMessageAt)
            if (calls.length) lastCallAt = latestDate(calls, "updatedAt", lastCallAt)
            if (signals.length) lastSignalAt = latestDate(signals, "createdAt", lastSignalAt)

            if (Date.now() - lastPingAt > 15_000) {
              controller.enqueue(pingChunk())
              lastPingAt = Date.now()
            }
          } catch (caught) {
            controller.enqueue(eventChunk("stream-error", { message: caught?.message || "Realtime stream error" }))
            await delay(2_000)
          }

          await delay(POLL_INTERVAL_MS)
        }

        controller.close()
      },
    })

    return new Response(stream, { headers: STREAM_HEADERS })
  } catch (caught) {
    return handleRouteError("messages.events", caught, request)
  }
}
