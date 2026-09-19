import { requireUser } from "@/lib/auth"
import { handleRouteError, json } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"
import { touchPresence } from "@/lib/user-presence"

export async function POST(request) {
  try {
    assertSameOrigin(request)
    const user = await requireUser(request)
    return json({ ok: true, presence: touchPresence(user) })
  } catch (caught) {
    return handleRouteError("presence.touch", caught, request)
  }
}
