import { requireUser } from "@/lib/auth"
import { error, handleRouteError, json, readJson } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"
import { requireConversationParticipant } from "@/lib/calls"
import { setTyping } from "@/lib/message-typing"

export async function POST(request) {
  try {
    assertSameOrigin(request)
    const user = await requireUser(request)
    const body = await readJson(request, 2_048)
    const conversationId = String(body.conversationId || "")
    if (!conversationId) return error("Cuộc trò chuyện không hợp lệ", 400)

    await requireConversationParticipant(conversationId, user.id)
    setTyping(conversationId, user)
    return json({ ok: true })
  } catch (caught) {
    return handleRouteError("messages.typing", caught, request)
  }
}
