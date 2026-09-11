import test from "node:test"
import assert from "node:assert/strict"
import {
  assertOwnProfile,
  cleanText,
  normalizeIdentity,
  validateEmail,
  validateHttpUrl,
  validatePassword,
  validateUsername,
} from "../src/lib/security.js"
import { avatarUploadFilename, isValidAvatarAsset, matchesFileSignature } from "../src/lib/storage.js"
import { validatePublicationInput } from "../src/lib/publications.js"
import { buildRateLimitKey } from "../src/lib/rate-limit.js"
import { reportTargetData, validateModerationAction, validateReportInput } from "../src/lib/moderation.js"

test("identity values normalize consistently", () => {
  assert.equal(normalizeIdentity("  MinhDucFishing  "), "minhducfishing")
  assert.equal(validateEmail(" USER@Example.COM "), "user@example.com")
})

test("trust-boundary validators reject unsafe input", () => {
  assert.throws(() => validateUsername("ab"))
  assert.throws(() => validatePassword("weakpassword"))
  assert.throws(() => validateHttpUrl("javascript:alert(1)"))
  assert.throws(() => cleanText("x".repeat(11), { max: 10 }))
})

test("profile updates only allow the profile owner regardless of role", () => {
  assert.doesNotThrow(() => assertOwnProfile("user-1", "user-1"))
  assert.throws(
    () => assertOwnProfile("admin-1", "user-1"),
    (error) => error.status === 403 && error.message === "Không có quyền chỉnh sửa hồ sơ này"
  )
})

test("valid profile and media values pass", () => {
  assert.equal(validateUsername("CanThu_2026"), "CanThu_2026")
  assert.equal(validatePassword("StrongPass123"), "StrongPass123")
  assert.equal(validateHttpUrl("https://example.com/fish.webp"), "https://example.com/fish.webp")
})

test("upload signatures must match declared MIME", () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=", "base64")
  assert.equal(matchesFileSignature(png, "image/png"), true)
  assert.equal(matchesFileSignature(Buffer.from("<html>bad</html>"), "image/png"), false)
})

test("avatar uploads stay image-only, same-origin and size-limited", () => {
  const filename = "00000000-0000-4000-8000-000000000000.jpg"
  assert.equal(avatarUploadFilename(`https://fishviet.vn/api/uploads/${filename}`, "https://fishviet.vn"), filename)
  assert.equal(avatarUploadFilename(`https://evil.example/api/uploads/${filename}`, "https://fishviet.vn"), null)
  assert.equal(avatarUploadFilename(`https://fishviet.vn/api/uploads/${filename}?x=1`, "https://fishviet.vn"), null)
  assert.equal(isValidAvatarAsset({ mimeType: "image/jpeg", size: 5 * 1024 * 1024 }), true)
  assert.equal(isValidAvatarAsset({ mimeType: "video/mp4", size: 1024 }), false)
  assert.equal(isValidAvatarAsset({ mimeType: "image/png", size: 5 * 1024 * 1024 + 1 }), false)
})

test("publication links must match selected platform", () => {
  assert.equal(
    validatePublicationInput({ platform: "YOUTUBE", url: "https://youtu.be/demo" }).url,
    "https://youtu.be/demo"
  )
  assert.throws(() => validatePublicationInput({ platform: "YOUTUBE", url: "https://example.com/demo" }))
  assert.throws(() => validatePublicationInput({ platform: "FACEBOOK", url: "javascript:alert(1)" }))
})

test("rate-limit keys hide raw identity and remain scope-specific", () => {
  const first = buildRateLimitKey("posts.create", "user-1")
  assert.match(first, /^[a-f0-9]{64}$/)
  assert.equal(first, buildRateLimitKey("posts.create", "user-1"))
  assert.notEqual(first, buildRateLimitKey("messages.send", "user-1"))
  assert.equal(first.includes("user-1"), false)
})

test("content reports require valid target, reason, and moderation action", () => {
  assert.deepEqual(
    validateReportInput({ targetType: "post", targetId: "post-1", reason: "spam", details: "Repeated ads" }),
    { targetType: "POST", targetId: "post-1", reason: "SPAM", details: "Repeated ads" }
  )
  assert.deepEqual(reportTargetData("COMMENT", "comment-1"), { commentId: "comment-1" })
  assert.equal(validateModerationAction({ action: "remove_post" }).action, "REMOVE_POST")
  assert.throws(() => validateReportInput({ targetType: "POST", targetId: "", reason: "SPAM" }))
  assert.throws(() => validateReportInput({ targetType: "POST", targetId: "post-1", reason: "BAD_REASON" }))
  assert.throws(() => validateModerationAction({ action: "PUBLISH_ANYWAY" }))
})
