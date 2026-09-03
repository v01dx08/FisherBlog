import { db } from "@/lib/db"
import { json } from "@/lib/http"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return json({ status: "ok", database: "connected", timestamp: new Date().toISOString() })
  } catch {
    return json({ status: "degraded", database: "unavailable" }, 503)
  }
}
