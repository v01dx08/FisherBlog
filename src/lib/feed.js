import { db } from "@/lib/db"
import { serializePost } from "@/lib/posts"

export const feedAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
}

export const feedCommentInclude = {
  author: { select: feedAuthorSelect },
}

export async function getPostFeed({
  tag,
  query,
  saved = false,
  cursor = null,
  limit = 12,
  currentUser = null,
}) {
  if (saved && !currentUser) return { items: [], nextCursor: null }

  const posts = await db.post.findMany({
    where: {
      visibility: "PUBLIC",
      ...(tag ? { content: { contains: tag.startsWith("#") ? tag : `#${tag}`, mode: "insensitive" } } : {}),
      ...(query
        ? {
            OR: [
              { content: { contains: query, mode: "insensitive" } },
              { species: { contains: query, mode: "insensitive" } },
              { spotName: { contains: query, mode: "insensitive" } },
              { author: { username: { contains: query, mode: "insensitive" } } },
              { author: { displayName: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(saved ? { bookmarks: { some: { userId: currentUser.id } } } : {}),
    },
    include: {
      author: { select: feedAuthorSelect },
      comments: {
        include: feedCommentInclude,
        orderBy: { createdAt: "asc" },
        take: 20,
      },
      likes: currentUser ? { where: { userId: currentUser.id }, select: { userId: true } } : false,
      bookmarks: currentUser
        ? { where: { userId: currentUser.id }, select: { userId: true } }
        : false,
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = posts.length > limit
  const page = hasMore ? posts.slice(0, limit) : posts
  return {
    items: page.map((post) => serializePost(post, currentUser?.id)),
    nextCursor: hasMore ? page.at(-1)?.id : null,
  }
}
