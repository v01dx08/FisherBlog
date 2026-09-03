import { RequestError } from "./http.js"

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export function assertSameOrigin(request) {
  if (!MUTATING_METHODS.has(request.method)) return

  const origin = request.headers.get("origin")
  const site = request.headers.get("sec-fetch-site")
  const requestUrl = new URL(request.url)
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const host = forwardedHost || request.headers.get("host")
  const expectedOrigins = new Set([
    requestUrl.origin,
    ...(host ? [`${forwardedProto || requestUrl.protocol.slice(0, -1)}://${host}`] : []),
  ])

  if (origin && !expectedOrigins.has(origin)) {
    throw new RequestError("Yêu cầu khác nguồn bị từ chối", 403)
  }

  if (site && !["same-origin", "none"].includes(site)) {
    throw new RequestError("Yêu cầu khác nguồn bị từ chối", 403)
  }

  if (process.env.NODE_ENV === "production" && !origin && site !== "same-origin") {
    throw new RequestError("Không xác minh được nguồn yêu cầu", 403)
  }
}

export function normalizeIdentity(value) {
  return String(value || "").trim().toLocaleLowerCase("en-US")
}

export function cleanText(value, { name = "Nội dung", min = 1, max = 2_000 } = {}) {
  const text = String(value || "").replace(/\r\n/g, "\n").trim()
  if (text.length < min) throw new RequestError(`${name} quá ngắn`, 400)
  if (text.length > max) throw new RequestError(`${name} vượt quá ${max} ký tự`, 400)
  return text
}

export function optionalText(value, { name = "Nội dung", max = 500 } = {}) {
  if (value === undefined || value === null || value === "") return null
  return cleanText(value, { name, min: 1, max })
}

export function validateUsername(value) {
  const username = String(value || "").trim()
  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
    throw new RequestError("Tên đăng nhập cần 3–30 ký tự, chỉ gồm chữ, số hoặc dấu gạch dưới", 400)
  }
  return username
}

export function validateEmail(value) {
  const email = normalizeIdentity(value)
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestError("Địa chỉ email không hợp lệ", 400)
  }
  return email
}

export function validatePassword(value) {
  const password = String(value || "")
  if (password.length < 10 || password.length > 128) {
    throw new RequestError("Mật khẩu cần từ 10 đến 128 ký tự", 400)
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new RequestError("Mật khẩu cần chữ thường, chữ hoa và chữ số", 400)
  }
  return password
}

export function validateHttpUrl(value, name = "Đường dẫn") {
  if (!value) return null
  let url
  try {
    url = new URL(String(value).trim())
  } catch {
    throw new RequestError(`${name} không hợp lệ`, 400)
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new RequestError(`${name} phải dùng HTTP hoặc HTTPS`, 400)
  }
  return url.toString()
}

export function clampLimit(value, fallback = 12, ceiling = 30) {
  const parsed = Number.parseInt(value || "", 10)
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), ceiling) : fallback
}
