import { db } from "@/lib/db";
import { handleRouteError, json } from "@/lib/http";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().slice(0, 80);

    if (!q || q.length < 1) {
      return json({ users: [], tags: [] });
    }

    // Search users by username or displayName
    const users = await db.user.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        username: true,
        displayName: true,
        location: true,
        avatarUrl: true,
        _count: { select: { posts: true } },
      },
      take: 5,
    });

    const tagCountMap = {};
    const allPosts = await db.post.findMany({
      where: { visibility: "PUBLIC" },
      select: { content: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    for (const post of allPosts) {
      const matches = post.content.match(/#[a-zA-Z0-9_\u00C0-\u1EF9]+/g);
      if (matches) {
        for (const tag of matches) {
          const clean = tag.slice(1).toLowerCase();
          tagCountMap[clean] = (tagCountMap[clean] || 0) + 1;
        }
      }
    }

    const matchingTags = Object.entries(tagCountMap)
      .filter(([tag]) => tag.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({
        tag,
        label: `#${tag}`,
        count: count >= 1000 ? `${(count / 1000).toFixed(1)}K bài` : `${count} bài`,
      }));

    return json({
        users: users.map((u) => ({
          username: u.username,
          name: u.displayName || u.username,
          location: u.location || "",
          avatarUrl: u.avatarUrl,
          postCount: u._count.posts,
        })),
        tags: matchingTags,
    });
  } catch (caught) {
    return handleRouteError("search", caught);
  }
}
