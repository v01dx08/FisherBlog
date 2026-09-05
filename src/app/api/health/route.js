import { db } from "@/lib/db"
import { getRequestId, json, logEvent } from "@/lib/http"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    await db.$queryRaw`SELECT 1`
    return json({
      status: "ok",
      database: "connected",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  } catch (caught) {
    const requestId = getRequestId(request)
    logEvent("error", "health.database_unavailable", {
      requestId,
      error: caught instanceof Error ? caught.message : String(caught),
    })
    return json({ status: "degraded", database: "unavailable", requestId }, 503, {
      "X-Request-Id": requestId,
    })
  }
}
