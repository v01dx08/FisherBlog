import { RequestError } from "./http.js"
import { optionalText } from "./security.js"

export const REPORT_REASONS = new Set([
  "SPAM",
  "HARASSMENT",
  "MISINFORMATION",
  "ILLEGAL_ACTIVITY",
  "COPYRIGHT",
  "NUDITY",
  "VIOLENCE",
  "OTHER",
])

export const REPORT_TARGET_TYPES = new Set(["POST", "COMMENT", "USER"])

export const MODERATION_ACTIONS = new Set([
  "DISMISS",
  "REMOVE_POST",
  "REMOVE_COMMENT",
  "SUSPEND_USER",
])

export function validateReportInput(body = {}) {
  const targetType = String(body.targetType || "").trim().toUpperCase()
  const targetId = String(body.targetId || "").trim()
  const reason = String(body.reason || "").trim().toUpperCase()
  const details = optionalText(body.details, { name: "Chi tiết báo cáo", max: 1_000 })

  if (!REPORT_TARGET_TYPES.has(targetType)) {
    throw new RequestError("Loại nội dung báo cáo không hợp lệ", 400)
  }
  if (!targetId || targetId.length > 120) {
    throw new RequestError("Thiếu mã nội dung cần báo cáo", 400)
  }
  if (!REPORT_REASONS.has(reason)) {
    throw new RequestError("Lý do báo cáo không hợp lệ", 400)
  }

  return { targetType, targetId, reason, details }
}

export function validateModerationAction(body = {}) {
  const action = String(body.action || "").trim().toUpperCase()
  const note = optionalText(body.note, { name: "Ghi chú kiểm duyệt", max: 1_000 })

  if (!MODERATION_ACTIONS.has(action)) {
    throw new RequestError("Hành động kiểm duyệt không hợp lệ", 400)
  }

  return { action, note }
}

export function reportTargetData(targetType, targetId) {
  if (targetType === "POST") return { postId: targetId }
  if (targetType === "COMMENT") return { commentId: targetId }
  if (targetType === "USER") return { targetUserId: targetId }
  throw new RequestError("Loại nội dung báo cáo không hợp lệ", 400)
}
