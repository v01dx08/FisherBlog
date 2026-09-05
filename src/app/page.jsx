import { FeedPageClient } from "@/components/FeedPageClient"
import { getCurrentUser } from "@/lib/auth"
import { getPostFeed } from "@/lib/feed"

export default async function Home({ searchParams }) {
  const params = await searchParams
  const tag = typeof params.tag === "string" ? params.tag.trim().slice(0, 80) : ""
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 120) : ""
  const saved = params.saved === "true"
  const currentUser = await getCurrentUser()
  const feed = await getPostFeed({ tag, query, saved, limit: 10, currentUser })

  return (
    <FeedPageClient
      key={`${tag}:${query}:${saved}`}
      initialPosts={feed.items}
      initialCursor={feed.nextCursor}
      initialUser={currentUser}
      tag={tag}
      query={query}
      saved={saved}
    />
  )
}
