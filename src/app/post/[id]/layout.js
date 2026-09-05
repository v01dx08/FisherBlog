import { db } from "@/lib/db"

function description(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 155)
}

function firstImage(value) {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed[0] || null : value
  } catch {
    return value
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const post = await db.post.findUnique({
    where: { id },
    select: {
      content: true,
      imageUrl: true,
      visibility: true,
      author: { select: { username: true, displayName: true } },
    },
  })
  if (!post || post.visibility !== "PUBLIC") {
    return { title: "Không tìm thấy bài viết", robots: { index: false, follow: false } }
  }

  const author = post.author.displayName || post.author.username
  const summary = description(post.content)
  const image = firstImage(post.imageUrl)
  return {
    title: `Bản gốc của ${author}`,
    description: summary,
    alternates: { canonical: `/post/${id}` },
    openGraph: {
      type: "article",
      title: `Bản gốc của ${author}`,
      description: summary,
      url: `/post/${id}`,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `Bản gốc của ${author}`,
      description: summary,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default function PostLayout({ children }) {
  return children
}
