import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { handleRouteError, json, readJson } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"
import { normalizeCallAction, requireCallSession } from "@/lib/calls"

const signalByAction = {
  accept: "accepted",
  decline: "declined",
  end: "ended",
}

export async function PATCH(request, { params }) {
  try {
    assertSameOrigin(request)
    const { callId } = await params
    const user = await requireUser(request)
    const body = await readJson(request, 2_048)
    const action = normalizeCallAction(body.action)
    const session = await requireCallSession(callId, user.id)

    const nextStatus = action === "accept" ? "active" : action === "decline" ? "declined" : "ended"
    const updated = await db.$transaction(async (tx) => {
      const call = await tx.callSession.update({
        where: { id: session.id },
        data: {
          status: nextStatus,
          ...(nextStatus === "ended" || nextStatus === "declined" ? { endedAt: new Date() } : {}),
        },
        include: { caller: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      })
      await tx.callSignal.create({
        data: {
          sessionId: session.id,
          senderId: user.id,
          type: signalByAction[action],
          payload: { action },
        },
      })
      return call
    })

    return json(updated)
  } catch (caught) {
    return handleRouteError("messages.calls.update", caught, request)
  }
}
