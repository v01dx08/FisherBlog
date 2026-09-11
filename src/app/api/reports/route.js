import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { error, handleRouteError, json, readJson } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"
import { enforceRateLimit } from "@/lib/rate-limit"
import { reportTargetData, validateReportInput } from "@/lib/moderation"

async function findReportTarget(targetType, targetId) {
  if (targetType === "POST") {
    const post = await db.post.findUnique({
      where: { id: targetId },
      select: { id: true, authorId: true, visibility: true },
    })
    if (!post || post.visibility !== "PUBLIC") return null
    return { ownerId: post.authorId }
  }

  if (targetType === "COMMENT") {
    const comment = await db.comment.findUnique({
      where: { id: targetId },
      select: { id: true, authorId: true, post: { select: { visibility: true } } },
    })
    if (!comment || comment.post.visibility !== "PUBLIC") return null
    return { ownerId: comment.authorId }
  }

  const user = await db.user.findUnique({
    where: { id: targetId },
    select: { id: true, status: true },
  })
  if (!user || user.status !== "ACTIVE") return null
  return { ownerId: user.id }
}

export async function POST(request) {
  try {
    assertSameOrigin(request)
    const reporter = await requireUser(request)
    await enforceRateLimit(request, { scope: "reports.create", actorId: reporter.id, limit: 20, windowMs: 60 * 60 * 1000 })
    const input = validateReportInput(await readJson(request, 4_096))
    const target = await findReportTarget(input.targetType, input.targetId)

    if (!target) return error("Không tìm thấy nội dung cần báo cáo", 404)
    if (target.ownerId === reporter.id) return error("Không thể tự báo cáo nội dung của bạn", 400)

    const existing = await db.report.findFirst({
      where: {
        reporterId: reporter.id,
        ...reportTargetData(input.targetType, input.targetId),
      },
      select: { id: true, status: true, createdAt: true },
    })

    if (existing) {
      return json({ ...existing, alreadyReported: true })
    }

    const report = await db.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          reporterId: reporter.id,
          targetType: input.targetType,
          reason: input.reason,
          details: input.details,
          ...reportTargetData(input.targetType, input.targetId),
        },
        select: { id: true, status: true, createdAt: true },
      })
      await tx.auditLog.create({
        data: {
          actorId: reporter.id,
          action: "report.create",
          target: created.id,
          metadata: {
            targetType: input.targetType,
            targetId: input.targetId,
            reason: input.reason,
          },
        },
      })
      return created
    })

    return json(report, 201)
  } catch (caught) {
    return handleRouteError("reports.create", caught, request)
  }
}
