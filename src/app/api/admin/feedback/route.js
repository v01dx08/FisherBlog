import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { assertSameOrigin, clampLimit } from "@/lib/security"
import { error, handleRouteError, json, readJson } from "@/lib/http"
import { validateFeedbackStatus } from "@/lib/feedback"

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  email: true,
}

export async function GET(request) {
  try {
    await requireAdmin(request)
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const limit = clampLimit(url.searchParams.get("limit"), 50, 100)
    const where = status && status !== "ALL" ? { status: validateFeedbackStatus(status) } : {}
    const [items, counts] = await Promise.all([
      db.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { user: { select: userSelect } },
      }),
      db.feedback.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ])

    return json({
      items,
      counts: counts.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count._all
        return acc
      }, { open: 0, reviewed: 0, archived: 0 }),
    })
  } catch (caught) {
    return handleRouteError("admin.feedback.list", caught, request)
  }
}

export async function PATCH(request) {
  try {
    assertSameOrigin(request)
    const admin = await requireAdmin(request)
    const input = await readJson(request, 2_048)
    const id = String(input.id || "").trim()
    if (!id) return error("Thiếu feedback cần cập nhật", 400)
    const status = validateFeedbackStatus(input.status)

    const updated = await db.$transaction(async (tx) => {
      const feedback = await tx.feedback.update({
        where: { id },
        data: { status },
        include: { user: { select: userSelect } },
      })
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "feedback.update",
          target: id,
          metadata: { status },
        },
      })
      return feedback
    })

    return json(updated)
  } catch (caught) {
    return handleRouteError("admin.feedback.update", caught, request)
  }
}
