import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { error, handleRouteError, json, readJson } from "@/lib/http"
import {
  assertSameOrigin,
  normalizeIdentity,
  validateEmail,
  validatePassword,
  validateUsername,
} from "@/lib/security"

export async function GET(request) {
  try {
    await requireAdmin(request)
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    })

    return json(
      users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        joined: user.createdAt.toISOString().slice(0, 10),
        posts: user._count.posts,
      }))
    )
  } catch (caught) {
    return handleRouteError("admin.users.list", caught)
  }
}

export async function POST(request) {
  try {
    assertSameOrigin(request)
    const admin = await requireAdmin(request)
    const body = await readJson(request, 8_192)
    const username = validateUsername(body.username)
    const email = validateEmail(body.email)
    const password = validatePassword(body.password)
    const usernameNormalized = normalizeIdentity(username)
    const emailNormalized = normalizeIdentity(email)

    const existing = await db.user.findFirst({
      where: { OR: [{ usernameNormalized }, { emailNormalized }] },
      select: { id: true },
    })
    if (existing) return error("Tên đăng nhập hoặc email đã tồn tại", 409)

    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username,
          usernameNormalized,
          email,
          emailNormalized,
          password: await bcrypt.hash(password, 12),
          role: "INFLUENCER",
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      })
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "user.create",
          target: created.id,
          metadata: { username: created.username },
        },
      })
      return created
    })

    return json(
      {
        ...user,
        joined: user.createdAt.toISOString().slice(0, 10),
        posts: 0,
      },
      201
    )
  } catch (caught) {
    return handleRouteError("admin.users.create", caught)
  }
}
