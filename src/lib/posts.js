import { createHash, randomUUID } from "node:crypto"

export function createPostProofPayload({
  authorId,
  content,
  imageUrl,
  videoUrl,
  media = [],
  species = null,
  weightKg = null,
  spotName = null,
  visibility = "PUBLIC",
  createdAt = new Date(),
  nonce = randomUUID(),
}) {
  return {
    version: 2,
    authorId,
    content,
    imageUrl: imageUrl || null,
    videoUrl: videoUrl || null,
    media: [...media]
      .map(({ filename, mimeType, size, sha256 }) => ({ filename, mimeType, size, sha256 }))
      .sort((left, right) => left.filename.localeCompare(right.filename)),
    species,
    weightKg,
    spotName,
    visibility,
    createdAt: createdAt.toISOString(),
    nonce,
  }
}

export function hashPostProofPayload(payload) {
  return createHash("sha256").update(canonicalJson(payload)).digest("hex")
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`
  }
  return JSON.stringify(value)
}

export function createPostProof(input) {
  const payload = createPostProofPayload(input)
  return hashPostProofPayload(payload)
}

export function serializePost(post, currentUserId = null) {
  const likes = post.likes || []
  const bookmarks = post.bookmarks || []

  return {
    ...post,
    likeCount: post._count?.likes ?? likes.length,
    commentCount: post._count?.comments ?? post.comments?.length ?? 0,
    isLiked: currentUserId ? likes.some((like) => like.userId === currentUserId) : false,
    isBookmarked: currentUserId
      ? bookmarks.some((bookmark) => bookmark.userId === currentUserId)
      : false,
    likes: undefined,
    bookmarks: undefined,
    _count: undefined,
  }
}
