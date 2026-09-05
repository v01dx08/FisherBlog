import { db } from "@/lib/db";
import { handleRouteError, json } from "@/lib/http";

export async function GET(request) {
  try {
    // Get recent posts and try to extract fish name + weight from content
    const posts = await db.post.findMany({
      where: {
        visibility: "PUBLIC",
        OR: [{ weightKg: { not: null } }, { content: { contains: "kg", mode: "insensitive" } }],
      },
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    const catches = posts.map((post) => {
      // Try to extract weight like "3kg", "3.2 kg", "4,5kg"
      const weightMatch = post.content.match(/(\d+[.,]?\d*)\s*kg/i);
      const weight = post.weightKg ? `${post.weightKg} kg` : weightMatch ? `${weightMatch[1]} kg` : null;

      // Try to extract fish name from common patterns like "cá Chẽm", "cá Lóc"
      const fishMatch = post.content.match(/cá\s+([A-ZÀ-Ỹa-zà-ỹ]+(?:\s+[A-ZÀ-Ỹa-zà-ỹ]+)?)/i);
      const fish = post.species || (fishMatch ? `Cá ${fishMatch[1]}` : "Cá chưa xác định");

      // Try to extract location from content
      const locationMatch = post.content.match(/(?:hồ|sông|biển|đập|cửa biển|ghềnh|vịnh)\s+([A-ZÀ-Ỹa-zà-ỹ\s]+?)(?:[.,!\n#]|$)/i);
      const location = post.spotName || (locationMatch
        ? locationMatch[0].trim().replace(/[.,!\n#]$/, "")
        : post.author.location || "");

      return {
        angler: post.author.displayName || post.author.username,
        username: post.author.username,
        avatarUrl: post.author.avatarUrl,
        fish,
        weight,
        location,
        postId: post.id,
        createdAt: post.createdAt,
      };
    }).filter((c) => c.weight);

    return json(catches);
  } catch (caught) {
    return handleRouteError("posts.recent-catches", caught, request);
  }
}
