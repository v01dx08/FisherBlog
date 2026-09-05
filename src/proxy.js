import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { COOKIE_NAME, verifyToken } from "@/lib/auth-token"

export async function proxy(request) {
  const suppliedRequestId = request.headers.get("x-request-id")
  const requestId = suppliedRequestId && /^[A-Za-z0-9._-]{8,128}$/.test(suppliedRequestId)
    ? suppliedRequestId
    : randomUUID()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-request-id", requestId)

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const payload = token ? await verifyToken(token) : null
    if (!payload || payload.role !== "ADMIN") {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
      if (token) loginUrl.searchParams.set("error", "unauthorized")
      const redirect = NextResponse.redirect(loginUrl)
      redirect.headers.set("x-request-id", requestId)
      return redirect
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("x-request-id", requestId)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
