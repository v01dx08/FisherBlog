import { createHash, randomUUID } from "node:crypto"

export function createPostProof({ authorId, content, imageUrl, videoUrl, createdAt = new Date() }) {
  const canonical = JSON.stringify({
    version: 1,
    authorId,
    content,
    imageUrl: imageUrl || null,
    videoUrl: videoUrl || null,
    createdAt: createdAt.toISOString(),
    nonce: randomUUID(),
  })
  return createHash("sha256").update(canonical).digest("hex")
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
