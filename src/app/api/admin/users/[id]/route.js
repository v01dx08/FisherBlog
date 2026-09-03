import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { error, handleRouteError, json } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"

export async function DELETE(request, { params }) {
  try {
    assertSameOrigin(request)
    const admin = await requireAdmin(request)
    const { id } = await params
    if (!id) return error("Thiếu mã định danh người dùng", 400)
    if (id === admin.id) return error("Không thể thu hồi tài khoản quản trị đang dùng", 400)

    const target = await db.user.findUnique({
      where: { id },
      select: { id: true, username: true, status: true },
    })
    if (!target) return error("Không tìm thấy người dùng", 404)

    await db.$transaction([
      db.user.update({
        where: { id },
        data: { status: "SUSPENDED", sessionVersion: { increment: 1 } },
      }),
      db.auditLog.create({
        data: {
          actorId: admin.id,
          action: "user.suspend",
          target: id,
          metadata: { username: target.username },
        },
      }),
    ])

    return json({ success: true, status: "SUSPENDED" })
  } catch (caught) {
    return handleRouteError("admin.users.suspend", caught)
  }
}

export async function PATCH(request, { params }) {
  try {
    assertSameOrigin(request)
    const admin = await requireAdmin(request)
    const { id } = await params
    const target = await db.user.findUnique({ where: { id }, select: { username: true } })
    if (!target) return error("Không tìm thấy người dùng", 404)

    await db.$transaction([
      db.user.update({ where: { id }, data: { status: "ACTIVE" } }),
      db.auditLog.create({
        data: {
          actorId: admin.id,
          action: "user.activate",
          target: id,
          metadata: { username: target.username },
        },
      }),
    ])
    return json({ success: true, status: "ACTIVE" })
  } catch (caught) {
    return handleRouteError("admin.users.activate", caught)
  }
}
