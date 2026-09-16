import { db } from "@/lib/db"
import { RequestError } from "@/lib/http"

export const callUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
}

export async function requireConversationParticipant(conversationId, userId) {
  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  })
  if (!participant) throw new RequestError("Không có quyền truy cập cuộc trò chuyện", 403)
  return participant
}

export async function requireCallSession(callId, userId) {
  const session = await db.callSession.findFirst({
    where: {
      id: callId,
      conversation: { participants: { some: { userId } } },
    },
    include: {
      caller: { select: callUserSelect },
    },
  })
  if (!session) throw new RequestError("Không tìm thấy cuộc gọi", 404)
  return session
}

export function normalizeCallMode(mode) {
  if (mode === "audio" || mode === "video") return mode
  throw new RequestError("Loại cuộc gọi không hợp lệ", 400)
}

export function normalizeCallAction(action) {
  if (["accept", "decline", "end"].includes(action)) return action
  throw new RequestError("Hành động cuộc gọi không hợp lệ", 400)
}

export function normalizeSignalType(type) {
  if (["offer", "answer", "candidate"].includes(type)) return type
  throw new RequestError("Tín hiệu cuộc gọi không hợp lệ", 400)
}
