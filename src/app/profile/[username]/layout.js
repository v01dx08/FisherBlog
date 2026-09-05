import { db } from "@/lib/db"
import { normalizeIdentity } from "@/lib/security"

export async function generateMetadata({ params }) {
  const { username } = await params
  const profile = await db.user.findUnique({
    where: { usernameNormalized: normalizeIdentity(username) },
    select: { username: true, displayName: true, bio: true, status: true },
  })
  if (!profile || profile.status !== "ACTIVE") {
    return { title: "Không tìm thấy hồ sơ", robots: { index: false, follow: false } }
  }

  const name = profile.displayName || profile.username
  const summary = profile.bio || `Hồ sơ và các bản ghi nội dung gốc của ${name} trên Nhật ký ngày đi câu.`
  const canonical = `/profile/${encodeURIComponent(profile.username)}`
  return {
    title: name,
    description: summary.slice(0, 155),
    alternates: { canonical },
    openGraph: { type: "profile", title: name, description: summary, url: canonical },
    twitter: { card: "summary", title: name, description: summary },
  }
}

export default function ProfileLayout({ children }) {
  return children
}
