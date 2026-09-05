import { createHash } from "node:crypto"
import { db } from "./db.js"
import { getClientIp, RequestError } from "./http.js"

export function buildRateLimitKey(scope, identity) {
  return createHash("sha256").update(`${scope}:${identity}`).digest("hex")
}

export async function enforceRateLimit(request, {
  scope,
  actorId,
  limit,
  windowMs,
}) {
  const now = new Date()
  const key = buildRateLimitKey(scope, actorId || getClientIp(request))
  const incremented = await db.rateLimit.updateMany({
    where: { key, resetAt: { gt: now }, count: { lt: limit } },
    data: { count: { increment: 1 } },
  })
  if (incremented.count) return

  const existing = await db.rateLimit.findUnique({ where: { key } })
  if (existing?.resetAt > now) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1_000))
    throw new RequestError("Bạn thao tác quá nhanh. Vui lòng thử lại sau", 429, undefined, {
      "Retry-After": String(retryAfter),
    })
  }

  await db.rateLimit.upsert({
    where: { key },
    update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
    create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
  })
}
