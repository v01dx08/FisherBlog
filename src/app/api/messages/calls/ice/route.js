import { requireUser } from "@/lib/auth"
import { getIceServerConfig } from "@/lib/ice-servers"
import { handleRouteError, json } from "@/lib/http"

export async function GET(request) {
  try {
    await requireUser(request)
    return json(getIceServerConfig(), 200, { "Cache-Control": "no-store" })
  } catch (caught) {
    return handleRouteError("messages.calls.ice", caught, request)
  }
}
