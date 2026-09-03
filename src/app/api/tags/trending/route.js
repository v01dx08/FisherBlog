import { db } from "@/lib/db";
import { handleRouteError, json } from "@/lib/http";

export async function GET() {
  try {
    const allPosts = await db.post.findMany({
      where: { visibility: "PUBLIC" },
      select: { content: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const tagCountMap = {};

    for (const post of allPosts) {
      const matches = post.content.match(/#[a-zA-Z0-9_\u00C0-\u1EF9]+/g);
      if (matches) {
        for (const tag of matches) {
          const clean = tag.slice(1);
          const key = clean.toLowerCase();
          if (!tagCountMap[key]) {
            tagCountMap[key] = { display: clean, count: 0 };
          }
          tagCountMap[key].count++;
        }
      }
    }

    const trending = Object.values(tagCountMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((t) => ({
        tag: t.display,
        label: `#${t.display}`,
        count: t.count >= 1000 ? `${(t.count / 1000).toFixed(1)}K bài` : `${t.count} bài`,
        rawCount: t.count,
      }));

    return json(trending);
  } catch (caught) {
    return handleRouteError("tags.trending", caught);
  }
}
