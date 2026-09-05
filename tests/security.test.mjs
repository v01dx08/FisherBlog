import test from "node:test"
import assert from "node:assert/strict"
import {
  cleanText,
  normalizeIdentity,
  validateEmail,
  validateHttpUrl,
  validatePassword,
  validateUsername,
} from "../src/lib/security.js"
import { matchesFileSignature } from "../src/lib/storage.js"
import { validatePublicationInput } from "../src/lib/publications.js"
import { buildRateLimitKey } from "../src/lib/rate-limit.js"

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
