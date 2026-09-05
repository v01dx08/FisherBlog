import { db } from "@/lib/db"
import { logEvent } from "@/lib/http"
import { connection } from "next/server"

export const dynamic = "force-dynamic"

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fishviet.vn"
  const staticRoutes = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/explore`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/legal`, changeFrequency: "yearly", priority: 0.2 },
  ]

  try {
    await connection()
    const [posts, users] = await Promise.all([
      db.post.findMany({
        where: { visibility: "PUBLIC" },
        select: { id: true, updatedAt: true, imageUrl: true },
        orderBy: { updatedAt: "desc" },
        take: 40_000,
      }),
      db.user.findMany({
        where: { status: "ACTIVE", isProfileCompleted: true },
        select: { username: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 9_000,
      }),
    ])
    return [
      ...staticRoutes,
      ...posts.map((post) => ({
        url: `${baseUrl}/post/${post.id}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      })),
      ...users.map((user) => ({
        url: `${baseUrl}/profile/${encodeURIComponent(user.username)}`,
        lastModified: user.createdAt,
        changeFrequency: "weekly",
        priority: 0.6,
      })),
    ]
  } catch (caught) {
    logEvent("error", "sitemap.database_unavailable", {
      error: caught instanceof Error ? caught.message : String(caught),
    })
    return staticRoutes
  }
}
