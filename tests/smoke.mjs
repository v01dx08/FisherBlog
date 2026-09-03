import assert from "node:assert/strict"

const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000"
const originHeaders = { Origin: baseUrl, "Content-Type": "application/json" }

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options)
  const data = await response.json().catch(() => null)
  return { response, data }
}

const health = await request("/api/health")
assert.equal(health.response.status, 200)
assert.equal(health.data.database, "connected")

const feed = await request("/api/posts?limit=2")
assert.equal(feed.response.status, 200)
assert.ok(Array.isArray(feed.data.items))

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

const authenticatedHeaders = { ...originHeaders, Cookie: cookie }
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

const privateMedia = await fetch(`${baseUrl}${upload.url}`)
assert.equal(privateMedia.status, 404)

const created = await request("/api/posts", {
  method: "POST",
  headers: authenticatedHeaders,
  body: JSON.stringify({
    content: "Smoke test production route #smoke",
    imageUrl: new URL(upload.url, baseUrl).toString(),
    visibility: "PUBLIC",
  }),
})
assert.equal(created.response.status, 201)
assert.match(created.data.proofHash, /^[a-f0-9]{64}$/)

const publicMedia = await fetch(`${baseUrl}${upload.url}`)
assert.equal(publicMedia.status, 200)
assert.equal(publicMedia.headers.get("content-type"), "image/png")

const proof = await request(`/api/posts/${created.data.id}/proof`)
assert.equal(proof.response.status, 200)
assert.equal(proof.data.sha256, created.data.proofHash)

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

console.log("Smoke test passed: health, feed, login, admin, post proof, publication links, cleanup")
