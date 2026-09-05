import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { PrismaClient } from "@prisma/client"

const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000"
const originHeaders = { Origin: baseUrl, "Content-Type": "application/json" }
const db = new PrismaClient()
const smokePostContent = "Smoke test production route #smoke"

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options)
  const data = await response.json().catch(() => null)
  return { response, data }
}

const health = await request("/api/health")
assert.equal(health.response.status, 200)
assert.equal(health.data.database, "connected")
assert.match(health.response.headers.get("x-request-id") || "", /^[A-Za-z0-9._-]{8,128}$/)

const tracedHealth = await fetch(`${baseUrl}/api/health`, { headers: { "X-Request-Id": "smoke-request-123" } })
assert.equal(tracedHealth.headers.get("x-request-id"), "smoke-request-123")

const home = await fetch(baseUrl)
assert.equal(home.status, 200)
assert.match(home.headers.get("content-security-policy") || "", /frame-ancestors 'none'/)
assert.equal(home.headers.get("x-frame-options"), "DENY")
const homeHtml = await home.text()

const robots = await fetch(`${baseUrl}/robots.txt`)
assert.equal(robots.status, 200)
assert.match(await robots.text(), /Disallow: \/admin\//)

const sitemap = await fetch(`${baseUrl}/sitemap.xml`)
assert.equal(sitemap.status, 200)
assert.match(sitemap.headers.get("content-type") || "", /application\/xml/)

const openGraphImage = await fetch(`${baseUrl}/opengraph-image`)
assert.equal(openGraphImage.status, 200)
assert.equal(openGraphImage.headers.get("content-type"), "image/png")

const protectedAdmin = await fetch(`${baseUrl}/admin`, { redirect: "manual" })
assert.equal(protectedAdmin.status, 307)
assert.match(protectedAdmin.headers.get("location") || "", /\/login\?callbackUrl=%2Fadmin/)

const feed = await request("/api/posts?limit=2")
assert.equal(feed.response.status, 200)
assert.ok(Array.isArray(feed.data.items))
if (feed.data.items[0]?.content) {
  assert.match(homeHtml, new RegExp(feed.data.items[0].content.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
}

const login = await request("/api/auth/login", {
  method: "POST",
  headers: originHeaders,
  body: JSON.stringify({
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  }),
})
assert.equal(login.response.status, 200)
const cookie = login.response.headers.get("set-cookie")?.split(";", 1)[0]
assert.ok(cookie)

const smokeScopes = ["account.export", "posts.create", "posts.delete", "uploads.create", "posts.publications"]
const smokeRateLimitKeys = smokeScopes.map((scope) => createHash("sha256")
  .update(`${scope}:${login.data.user.id}`)
  .digest("hex"))
await db.rateLimit.deleteMany({ where: { key: { in: smokeRateLimitKeys } } })

const authenticatedHeaders = { ...originHeaders, Cookie: cookie }
const stalePosts = await request(`/api/posts?q=${encodeURIComponent(smokePostContent)}&limit=30`)
for (const post of stalePosts.data?.items || []) {
  if (post.content === smokePostContent) {
    const staleRemoval = await request(`/api/posts/${post.id}`, { method: "DELETE", headers: authenticatedHeaders })
    assert.equal(staleRemoval.response.status, 200)
  }
}

const stats = await request("/api/admin/stats", { headers: { Cookie: cookie } })
assert.equal(stats.response.status, 200)
assert.ok(stats.data.kpis.totalUsers >= 1)

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=", "base64")
const form = new FormData()
form.set("file", new File([png], "catch.png", { type: "image/png" }))
const uploadResponse = await fetch(`${baseUrl}/api/uploads`, {
  method: "POST",
  headers: { Origin: baseUrl, Cookie: cookie },
  body: form,
})
const upload = await uploadResponse.json()
assert.equal(uploadResponse.status, 201)
assert.match(upload.sha256, /^[a-f0-9]{64}$/)

const privateMedia = await fetch(`${baseUrl}${upload.url}`)
assert.equal(privateMedia.status, 404)

const ownerMedia = await fetch(`${baseUrl}${upload.url}`, { headers: { Cookie: cookie } })
assert.equal(ownerMedia.status, 200)
assert.match(ownerMedia.headers.get("cache-control") || "", /private, no-store/)
assert.equal(ownerMedia.headers.get("etag"), `"sha256-${upload.sha256}"`)

const suffixRange = await fetch(`${baseUrl}${upload.url}`, {
  headers: { Cookie: cookie, Range: "bytes=-8" },
})
assert.equal(suffixRange.status, 206)
assert.equal(suffixRange.headers.get("content-range"), `bytes ${png.length - 8}-${png.length - 1}/${png.length}`)

const created = await request("/api/posts", {
  method: "POST",
  headers: authenticatedHeaders,
  body: JSON.stringify({
    content: smokePostContent,
    imageUrl: new URL(upload.url, baseUrl).toString(),
    visibility: "PUBLIC",
  }),
})
assert.equal(created.response.status, 201)
assert.match(created.data.proofHash, /^[a-f0-9]{64}$/)
assert.equal(created.data.proofVersion, 2)
assert.equal(created.data.proofPayload.media[0].sha256, upload.sha256)

const postSharePage = await fetch(`${baseUrl}/post/${created.data.id}`, {
  headers: { "User-Agent": "facebookexternalhit/1.1" },
})
const postShareHtml = await postSharePage.text()
assert.equal(postSharePage.status, 200)
assert.match(postShareHtml, /Bản gốc của/)
assert.match(postShareHtml, new RegExp(`/post/${created.data.id}`))

const profileSharePage = await fetch(`${baseUrl}/profile/${process.env.ADMIN_USERNAME}`, {
  headers: { "User-Agent": "facebookexternalhit/1.1" },
})
assert.equal(profileSharePage.status, 200)
assert.match(await profileSharePage.text(), /FishViet/)

const publicMedia = await fetch(`${baseUrl}${upload.url}`)
assert.equal(publicMedia.status, 200)
assert.equal(publicMedia.headers.get("content-type"), "image/png")

const proof = await request(`/api/posts/${created.data.id}/proof`)
assert.equal(proof.response.status, 200)
assert.equal(proof.data.sha256, created.data.proofHash)
assert.equal(proof.data.version, 2)
assert.equal(proof.data.independentlyVerified, true)
assert.equal(proof.data.payload.media[0].sha256, upload.sha256)

const exported = await request("/api/account/export", { headers: { Cookie: cookie } })
assert.equal(exported.response.status, 200)
assert.match(exported.response.headers.get("content-disposition") || "", /attachment/)
assert.equal(exported.data.user.username, process.env.ADMIN_USERNAME)

const publication = await request(`/api/posts/${created.data.id}/publications`, {
  method: "POST",
  headers: authenticatedHeaders,
  body: JSON.stringify({
    platform: "OTHER",
    url: "https://example.com/fishviet-smoke",
  }),
})
assert.equal(publication.response.status, 201)

const linkedProof = await request(`/api/posts/${created.data.id}/proof`)
assert.equal(linkedProof.response.status, 200)
assert.equal(linkedProof.data.publications.length, 1)
assert.equal(linkedProof.data.publications[0].url, "https://example.com/fishviet-smoke")

const removedPublication = await request(`/api/posts/${created.data.id}/publications`, {
  method: "DELETE",
  headers: authenticatedHeaders,
  body: JSON.stringify({ publicationId: publication.data.id }),
})
assert.equal(removedPublication.response.status, 200)

const removed = await request(`/api/posts/${created.data.id}`, {
  method: "DELETE",
  headers: authenticatedHeaders,
})
assert.equal(removed.response.status, 200)

await db.$disconnect()

console.log("Smoke test passed: security headers, SEO, auth, media privacy/range, proof v2, export, publication, cleanup")
