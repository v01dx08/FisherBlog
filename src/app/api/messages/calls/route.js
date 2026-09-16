import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { handleRouteError, json, readJson } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"
import { enforceRateLimit } from "@/lib/rate-limit"
import { callUserSelect, normalizeCallMode, requireConversationParticipant } from "@/lib/calls"

const ACTIVE_STATUSES = ["ringing", "active"]

export async function GET(request) {
  try {
    const user = await requireUser(request)
    const url = new URL(request.url)
    const conversationId = String(url.searchParams.get("conversationId") || "")
    await requireConversationParticipant(conversationId, user.id)

    const staleBefore = new Date(Date.now() - 20 * 60 * 1000)
    const sessions = await db.callSession.findMany({
      where: {
        conversationId,
        status: { in: ACTIVE_STATUSES },
        createdAt: { gte: staleBefore },
      },
      include: {
        caller: { select: callUserSelect },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    return json({ items: sessions })
  } catch (caught) {
    return handleRouteError("messages.calls.list", caught, request)
  }
}

export async function POST(request) {
  try {
    assertSameOrigin(request)
    const user = await requireUser(request)
    await enforceRateLimit(request, { scope: "messages.calls", actorId: user.id, limit: 30, windowMs: 10 * 60 * 1000 })

    const body = await readJson(request, 8_192)
    const conversationId = String(body.conversationId || "")
    const mode = normalizeCallMode(body.mode)
    await requireConversationParticipant(conversationId, user.id)

    const session = await db.callSession.create({
      data: {
        conversationId,
        callerId: user.id,
        mode,
        status: "ringing",
      },
      include: {
        caller: { select: callUserSelect },
      },
    })

    return json(session, 201)
  } catch (caught) {
    return handleRouteError("messages.calls.create", caught, request)
  }
}
