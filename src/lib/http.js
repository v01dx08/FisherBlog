const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" }

export function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  })
}

export function error(message, status = 400, details) {
  return json({ error: message, ...(details ? { details } : {}) }, status)
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
  constructor(message, status = 400, details) {
    super(message)
    this.name = "RequestError"
    this.status = status
    this.details = details
  }
}

export function handleRouteError(route, caught) {
  if (caught instanceof RequestError) {
    return error(caught.message, caught.status, caught.details)
  }

  if (caught?.code === "P2002") return error("Dữ liệu đã tồn tại", 409)
  if (caught?.code === "P2025") return error("Không tìm thấy dữ liệu", 404)

  console.error(`[${route}]`, caught)
  return error("Lỗi máy chủ nội bộ", 500)
}

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}
