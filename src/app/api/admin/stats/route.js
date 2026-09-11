import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { handleRouteError, json } from "@/lib/http"

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

function dayKey(date) {
  return dayFormatter.format(date)
}

export async function GET(request) {
  try {
    await requireAdmin(request)
    const start = new Date()
    start.setUTCDate(start.getUTCDate() - 7)

    const [totalUsers, totalPosts, totalComments, totalLikes, openReports, posts, comments, likes, users] =
      await Promise.all([
        db.user.count({ where: { status: "ACTIVE" } }),
        db.post.count(),
        db.comment.count(),
        db.like.count(),
        db.report.count({ where: { status: "OPEN" } }),
        db.post.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
        db.comment.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
        db.like.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
        db.user.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
      ])

    const timelineMap = new Map()
    const now = new Date()
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(now)
      date.setUTCDate(date.getUTCDate() - offset)
      const key = dayKey(date)
      timelineMap.set(key, {
        date: key,
        label: key.slice(8, 10) + "-" + key.slice(5, 7),
        posts: 0,
        interactions: 0,
        newUsers: 0,
      })
    }

    for (const item of posts) {
      const day = timelineMap.get(dayKey(item.createdAt))
      if (day) day.posts += 1
    }
    for (const item of comments) {
      const day = timelineMap.get(dayKey(item.createdAt))
      if (day) day.interactions += 1
    }
    for (const item of likes) {
      const day = timelineMap.get(dayKey(item.createdAt))
      if (day) day.interactions += 1
    }
    for (const item of users) {
      const day = timelineMap.get(dayKey(item.createdAt))
      if (day) day.newUsers += 1
    }

    return json({
      kpis: {
        totalUsers,
        totalPosts,
        totalComments,
        totalLikes,
        openReports,
      },
      timeline: [...timelineMap.values()],
    })
  } catch (caught) {
    return handleRouteError("admin.stats", caught, request)
  }
}
