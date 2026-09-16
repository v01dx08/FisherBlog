import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { RequestError, handleRouteError, json, readJson } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"
import { normalizeSignalType, requireCallSession } from "@/lib/calls"

export async function GET(request, { params }) {
  try {
    const { callId } = await params
    const user = await requireUser(request)
    await requireCallSession(callId, user.id)

    const url = new URL(request.url)
    const after = url.searchParams.get("after")
    const afterDate = after ? new Date(after) : null

    const signals = await db.callSignal.findMany({
      where: {
        sessionId: callId,
        senderId: { not: user.id },
        ...(afterDate && !Number.isNaN(afterDate.getTime()) ? { createdAt: { gt: afterDate } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    })

    return json({ items: signals })
  } catch (caught) {
    return handleRouteError("messages.calls.signals.list", caught, request)
  }
}

export async function POST(request, { params }) {
  try {
    assertSameOrigin(request)
    const { callId } = await params
    const user = await requireUser(request)
    await requireCallSession(callId, user.id)

    const body = await readJson(request, 128_000)
    const type = normalizeSignalType(body.type)
    const payload = body.payload
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new RequestError("Dữ liệu tín hiệu cuộc gọi không hợp lệ", 400)
    }

    const signal = await db.callSignal.create({
      data: {
        sessionId: callId,
        senderId: user.id,
        type,
        payload,
      },
    })

    return json(signal, 201)
  } catch (caught) {
    return handleRouteError("messages.calls.signals.create", caught, request)
  }
}
