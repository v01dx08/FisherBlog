import { RequestError } from "./http.js"
import { cleanText, optionalText } from "./security.js"

const FEEDBACK_CATEGORIES = new Set(["BUG", "UX", "FEATURE", "PERFORMANCE", "CONTENT", "OTHER"])
const FEEDBACK_PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH"])
const FEEDBACK_STATUSES = new Set(["OPEN", "REVIEWED", "ARCHIVED"])

export const feedbackCategoryLabels = {
  BUG: "Bug",
  UX: "Trải nghiệm",
  FEATURE: "Tính năng mới",
  PERFORMANCE: "Hiệu năng",
  CONTENT: "Nội dung",
  OTHER: "Khác",
}

export function validateFeedbackInput(input = {}) {
  const category = String(input.category || "OTHER").trim().toUpperCase()
  const priority = String(input.priority || "MEDIUM").trim().toUpperCase()
  if (!FEEDBACK_CATEGORIES.has(category)) throw new RequestError("Loại góp ý không hợp lệ", 400)
  if (!FEEDBACK_PRIORITIES.has(priority)) throw new RequestError("Mức độ ưu tiên không hợp lệ", 400)

  return {
    category,
    priority,
    subject: cleanText(input.subject, { name: "Tiêu đề góp ý", min: 4, max: 120 }),
    message: cleanText(input.message, { name: "Nội dung góp ý", min: 12, max: 4_000 }),
    contact: optionalText(input.contact, { name: "Thông tin liên hệ", max: 160 }),
  }
}

export function validateFeedbackStatus(value) {
  const status = String(value || "").trim().toUpperCase()
  if (!FEEDBACK_STATUSES.has(status)) throw new RequestError("Trạng thái feedback không hợp lệ", 400)
  return status
}
