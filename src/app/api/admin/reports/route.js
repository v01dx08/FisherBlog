import { unlink } from "node:fs/promises"
import path from "node:path"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { error, handleRouteError, json, readJson } from "@/lib/http"
import { assertSameOrigin, clampLimit } from "@/lib/security"
import { enforceRateLimit } from "@/lib/rate-limit"
import { UPLOAD_DIR } from "@/lib/storage"
import { validateModerationAction } from "@/lib/moderation"

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  status: true,
}

function targetFilter(report) {
  if (report.postId) return { postId: report.postId }
  if (report.commentId) return { commentId: report.commentId }
  if (report.targetUserId) return { targetUserId: report.targetUserId }
  return { id: report.id }
}

function serializeReport(report) {
  return {
    id: report.id,
    targetType: report.targetType,
    reason: report.reason,
    details: report.details,
    status: report.status,
    resolution: report.resolution,
    resolvedById: report.resolvedById,
    resolvedAt: report.resolvedAt,
    createdAt: report.createdAt,
    reporter: report.reporter,
    post: report.post
      ? {
          id: report.post.id,
          content: report.post.content,
          imageUrl: report.post.imageUrl,
          videoUrl: report.post.videoUrl,
          createdAt: report.post.createdAt,
          author: report.post.author,
        }
      : null,
    comment: report.comment
      ? {
          id: report.comment.id,
          content: report.comment.content,
          createdAt: report.comment.createdAt,
          author: report.comment.author,
          post: report.comment.post
            ? {
                id: report.comment.post.id,
                content: report.comment.post.content,
                author: report.comment.post.author,
              }
            : null,
        }
      : null,
    targetUser: report.targetUser,
  }
}

export async function GET(request) {
  try {
    await requireAdmin(request)
    const url = new URL(request.url)
    const status = String(url.searchParams.get("status") || "OPEN").toUpperCase()
    const limit = clampLimit(url.searchParams.get("limit"), 50, 100)
    if (!["OPEN", "DISMISSED", "ACTION_TAKEN", "ALL"].includes(status)) {
      return error("Trạng thái báo cáo không hợp lệ", 400)
    }

    const reports = await db.report.findMany({
      where: status === "ALL" ? {} : { status },
      include: {
        reporter: { select: userSelect },
        post: { include: { author: { select: userSelect } } },
        comment: {
          include: {
            author: { select: userSelect },
            post: { include: { author: { select: userSelect } } },
          },
        },
        targetUser: { select: userSelect },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: limit,
    })

    return json({
      items: reports.map(serializeReport),
      counts: {
        open: await db.report.count({ where: { status: "OPEN" } }),
      },
    })
  } catch (caught) {
    return handleRouteError("admin.reports.list", caught, request)
  }
}

export async function PATCH(request) {
  try {
    assertSameOrigin(request)
    const admin = await requireAdmin(request)
    await enforceRateLimit(request, { scope: "admin.reports.resolve", actorId: admin.id, limit: 60, windowMs: 60 * 60 * 1000 })
    const body = await readJson(request, 4_096)
    const id = String(body.id || "").trim()
    const { action, note } = validateModerationAction(body)

    if (!id) return error("Thiếu mã báo cáo", 400)

    const report = await db.report.findUnique({
      where: { id },
      include: {
        post: { select: { id: true, authorId: true, mediaAssets: { select: { filename: true } } } },
        comment: { select: { id: true, authorId: true, postId: true } },
        targetUser: { select: { id: true, username: true, role: true } },
      },
    })

    if (!report) return error("Không tìm thấy báo cáo", 404)
    if (report.status !== "OPEN") return error("Báo cáo đã được xử lý", 409)

    const resolution = note || action
    const commonUpdate = {
      status: action === "DISMISS" ? "DISMISSED" : "ACTION_TAKEN",
      resolvedById: admin.id,
      resolution,
      resolvedAt: new Date(),
    }
    const matchingReportsWhere = { status: "OPEN", ...targetFilter(report) }
    let removedMedia = []

    await db.$transaction(async (tx) => {
      if (action === "DISMISS") {
        await tx.report.update({ where: { id }, data: commonUpdate })
      } else if (action === "REMOVE_POST") {
        if (!report.postId || !report.post) throw new Error("ACTION_TARGET_MISMATCH")
        removedMedia = report.post.mediaAssets.map((asset) => asset.filename)
        await tx.report.updateMany({ where: matchingReportsWhere, data: commonUpdate })
        await tx.post.delete({ where: { id: report.postId } })
      } else if (action === "REMOVE_COMMENT") {
        if (!report.commentId || !report.comment) throw new Error("ACTION_TARGET_MISMATCH")
        await tx.report.updateMany({ where: matchingReportsWhere, data: commonUpdate })
        await tx.comment.delete({ where: { id: report.commentId } })
      } else if (action === "SUSPEND_USER") {
        if (!report.targetUserId || !report.targetUser) throw new Error("ACTION_TARGET_MISMATCH")
        if (report.targetUser.role === "ADMIN") throw new Error("CANNOT_SUSPEND_ADMIN")
        if (report.targetUserId === admin.id) throw new Error("CANNOT_SUSPEND_SELF")
        await tx.report.updateMany({ where: matchingReportsWhere, data: commonUpdate })
        await tx.user.update({
          where: { id: report.targetUserId },
          data: { status: "SUSPENDED", sessionVersion: { increment: 1 } },
        })
      }

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "report.resolve",
          target: report.id,
          metadata: {
            moderationAction: action,
            targetType: report.targetType,
            postId: report.postId,
            commentId: report.commentId,
            targetUserId: report.targetUserId,
            note,
          },
        },
      })
    })

    if (removedMedia.length > 0) {
      await Promise.allSettled(removedMedia.map((filename) => unlink(path.join(UPLOAD_DIR, filename))))
    }

    return json({ success: true, action })
  } catch (caught) {
    if (caught?.message === "ACTION_TARGET_MISMATCH") return error("Hành động không phù hợp với loại báo cáo", 400)
    if (caught?.message === "CANNOT_SUSPEND_ADMIN") return error("Không thể khóa tài khoản quản trị viên", 400)
    if (caught?.message === "CANNOT_SUSPEND_SELF") return error("Không thể khóa tài khoản đang dùng", 400)
    return handleRouteError("admin.reports.resolve", caught, request)
  }
}
