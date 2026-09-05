import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { handleRouteError, json, readJson } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request) {
  try {
    const user = await requireUser(request)
    const settings = await db.user.findUnique({
      where: { id: user.id },
      select: { hideLocation: true, notifyInteractions: true },
    })
    return json(settings)
  } catch (caught) {
    return handleRouteError("settings.get", caught, request)
  }
}

export async function PUT(request) {
  try {
    assertSameOrigin(request)
    const user = await requireUser(request)
    await enforceRateLimit(request, { scope: "settings.update", actorId: user.id, limit: 30, windowMs: 60 * 60 * 1000 })
    const body = await readJson(request, 2_048)
    const settings = await db.user.update({
      where: { id: user.id },
      data: {
        hideLocation: Boolean(body.hideLocation),
        notifyInteractions: body.notifyInteractions !== false,
      },
      select: { hideLocation: true, notifyInteractions: true },
    })
    return json(settings)
  } catch (caught) {
    return handleRouteError("settings.update", caught, request)
  }
}
