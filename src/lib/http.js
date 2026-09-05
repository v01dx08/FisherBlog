import { randomUUID } from "node:crypto"

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" }

export function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  })
}

export function error(message, status = 400, details, headers = {}) {
  return json({ error: message, ...(details ? { details } : {}) }, status, headers)
}

export async function readJson(request, maxBytes = 32_768) {
  const declaredLength = Number(request.headers.get("content-length") || 0)
  if (declaredLength > maxBytes) throw new RequestError("Dữ liệu gửi lên quá lớn", 413)

  let raw
  try {
    raw = await request.text()
  } catch {
    throw new RequestError("Không thể đọc dữ liệu gửi lên", 400)
  }

  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new RequestError("Dữ liệu gửi lên quá lớn", 413)
  }

  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    throw new RequestError("JSON không hợp lệ", 400)
  }
}

export class RequestError extends Error {
  constructor(message, status = 400, details, headers = {}) {
    super(message)
    this.name = "RequestError"
    this.status = status
    this.details = details
    this.headers = headers
  }
}

export function getRequestId(request) {
  const supplied = request?.headers?.get?.("x-request-id")
  return supplied && /^[A-Za-z0-9._-]{8,128}$/.test(supplied) ? supplied : randomUUID()
}

export function logEvent(level, event, fields = {}) {
  const write = level === "error" ? console.error : level === "warn" ? console.warn : console.log
  write(JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields }))
}

export function handleRouteError(route, caught, request) {
  if (caught instanceof RequestError) {
    return error(caught.message, caught.status, caught.details, caught.headers)
  }

  if (caught?.code === "P2002") return error("Dữ liệu đã tồn tại", 409)
  if (caught?.code === "P2025") return error("Không tìm thấy dữ liệu", 404)

  const requestId = getRequestId(request)
  logEvent("error", "route.error", {
    route,
    requestId,
    method: request?.method,
    pathname: request ? new URL(request.url).pathname : undefined,
    error: caught instanceof Error ? caught.message : String(caught),
    ...(process.env.NODE_ENV !== "production" && caught?.stack ? { stack: caught.stack } : {}),
  })
  return error("Lỗi máy chủ nội bộ", 500, { requestId }, { "X-Request-Id": requestId })
}

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}
