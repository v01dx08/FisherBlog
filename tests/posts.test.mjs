import test from "node:test"
import assert from "node:assert/strict"
import { createPostProof, serializePost } from "../src/lib/posts.js"

test("content proof is SHA-256 and nonce-backed", () => {
  const input = {
    authorId: "user-1",
    content: "Mẻ cá chẽm 3.2 kg",
    imageUrl: "https://example.com/fish.jpg",
    createdAt: new Date("2026-09-03T00:00:00.000Z"),
  }
  const first = createPostProof(input)
  const second = createPostProof(input)
  assert.match(first, /^[a-f0-9]{64}$/)
  assert.notEqual(first, second)
})

test("post serializer exposes counts and viewer state", () => {
  const result = serializePost({
    id: "post-1",
    likes: [{ userId: "viewer" }],
    bookmarks: [{ userId: "viewer" }],
    comments: [{ id: "comment-1" }],
    _count: { likes: 4, comments: 7 },
  }, "viewer")

  assert.equal(result.likeCount, 4)
  assert.equal(result.commentCount, 7)
  assert.equal(result.isLiked, true)
  assert.equal(result.isBookmarked, true)
  assert.equal(result.likes, undefined)
})
