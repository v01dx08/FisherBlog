import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { RequestError } from "@/lib/http"
import { COOKIE_NAME, signToken, verifyToken } from "@/lib/auth-token"

export { COOKIE_NAME, signToken, verifyToken }

export async function setSessionCookie(user) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, await signToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    priority: "high",
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

async function readToken(request) {
  if (request?.cookies?.get) return request.cookies.get(COOKIE_NAME)?.value || null
  return (await cookies()).get(COOKIE_NAME)?.value || null
}

export async function getSessionPayload(request) {
  const token = await readToken(request)
  return token ? verifyToken(token) : null
}

export async function getCurrentUser(request) {
  const payload = await getSessionPayload(request)
  if (!payload?.sub) return null

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      sessionVersion: true,
      displayName: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
      location: true,
      fishingStyle: true,
      youtubeUrl: true,
      tiktokUrl: true,
      facebookUrl: true,
      instagramUrl: true,
      isProfileCompleted: true,
      createdAt: true,
    },
  })

  if (!user || user.status !== "ACTIVE" || user.sessionVersion !== payload.version) return null
  return user
}

export async function requireUser(request) {
  const user = await getCurrentUser(request)
  if (!user) throw new RequestError("Vui lòng đăng nhập", 401)
  return user
}

export async function requireAdmin(request) {
  const user = await requireUser(request)
  if (user.role !== "ADMIN") throw new RequestError("Không có quyền truy cập", 403)
  return user
}
