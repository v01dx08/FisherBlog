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

const CALL_MESSAGE_PREFIX = "FISHVIET_CALL:"

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
      if (nextStatus === "ended" || nextStatus === "declined") {
        const existingHistory = await tx.message.findFirst({
          where: {
            conversationId: session.conversationId,
            content: { contains: `"callId":"${session.id}"` },
          },
          select: { id: true },
        })
        if (!existingHistory) {
          const startedAt = new Date(session.createdAt)
          const finishedAt = new Date()
          const durationSeconds = nextStatus === "ended"
            ? Math.max(0, Math.floor((finishedAt.getTime() - startedAt.getTime()) / 1000))
            : 0
          await tx.message.create({
            data: {
              conversationId: session.conversationId,
              senderId: user.id,
              content: `${CALL_MESSAGE_PREFIX}${JSON.stringify({
                callId: session.id,
                mode: session.mode,
                status: nextStatus,
                durationSeconds,
                endedByName: user.displayName || user.username,
              })}`,
              isRead: true,
            },
          })
          await tx.conversation.update({
            where: { id: session.conversationId },
            data: { updatedAt: finishedAt },
          })
        }
      }
      return call
    })

    return json(updated)
  } catch (caught) {
    return handleRouteError("messages.calls.update", caught, request)
  }
}
