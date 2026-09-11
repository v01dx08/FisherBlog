"use client"

import { Check, Fingerprint, Fish, LinkSimple, MapPin, Medal, Plus, UploadSimple } from "@phosphor-icons/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RightSidebar() {
  const [anglers, setAnglers] = useState([])
  const [catches, setCatches] = useState([])
  const [followingMap, setFollowingMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/users/suggested").then((response) => response.json()),
      fetch("/api/posts/recent-catches").then((response) => response.json()),
    ])
      .then(([usersData, catchesData]) => {
        if (Array.isArray(usersData)) setAnglers(usersData.slice(0, 4))
        if (Array.isArray(catchesData)) setCatches(catchesData.slice(0, 3))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleFollow = async (username) => {
    const previous = followingMap[username]
    setFollowingMap((items) => ({ ...items, [username]: !previous }))
    try {
      const response = await fetch(`/api/users/${username}/follow`, { method: "POST" })
      const data = await response.json()
      setFollowingMap((items) => ({ ...items, [username]: response.ok ? data.isFollowing : previous }))
    } catch {
      setFollowingMap((items) => ({ ...items, [username]: previous }))
    }
  }

  return (
    <>
      <aside className="hidden h-full w-[320px] shrink-0 flex-col gap-4 overflow-hidden pl-1 pr-2 lg:flex">
        <section className="water-panel rounded-2xl p-4">
          <div className="flex items-center gap-2"><Fingerprint size={18} weight="duotone" className="text-primary" /><h2 className="text-sm font-bold">Quy trình bảo vệ nội dung</h2></div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-card/65 p-2"><UploadSimple size={17} weight="duotone" className="mx-auto text-primary" /><p className="mt-1 text-[10px] font-semibold">Đăng bản gốc</p></div>
            <div className="rounded-xl bg-card/65 p-2"><Fingerprint size={17} weight="duotone" className="mx-auto text-primary" /><p className="mt-1 text-[10px] font-semibold">Nhận SHA-256</p></div>
            <div className="rounded-xl bg-card/65 p-2"><LinkSimple size={17} weight="duotone" className="mx-auto text-primary" /><p className="mt-1 text-[10px] font-semibold">Gắn link sau</p></div>
          </div>
        </section>

        <section className="social-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold">Cần thủ nổi bật</h2>
            <Link href="/explore" className="text-xs font-semibold text-primary hover:underline">Xem tất cả</Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-10 rounded-lg skeleton-shimmer" />)}</div>
            ) : anglers.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">Chưa có gợi ý mới.</p>
            ) : anglers.map((angler) => {
              const following = Boolean(followingMap[angler.username])
              return (
                <div key={angler.username} className="flex items-center gap-3">
                  <Link href={`/profile/${angler.username}`}>
                    <Avatar className="h-10 w-10 ring-1 ring-primary/25">
                      {angler.avatarUrl && <AvatarImage src={angler.avatarUrl} alt={angler.name || angler.username} className="object-cover" />}
                      <AvatarFallback className="bg-primary/12 text-xs font-bold text-primary">{(angler.name || angler.username).slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/profile/${angler.username}`} className="block truncate text-sm font-bold hover:text-primary">{angler.name || angler.username}</Link>
                    <p className="truncate text-[11px] text-muted-foreground">{angler.specialty || "Cộng đồng cần thủ"}</p>
                  </div>
                  <button type="button" onClick={() => toggleFollow(angler.username)} aria-label={following ? `Bỏ theo dõi ${angler.username}` : `Theo dõi ${angler.username}`} className={`kinetic flex h-8 w-8 items-center justify-center rounded-full ${following ? "bg-primary/15 text-primary" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                    {following ? <Check size={15} weight="bold" /> : <Plus size={15} weight="bold" />}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="social-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Medal size={18} weight="duotone" className="text-amber-400" />
            <h2 className="text-sm font-bold">Chiến tích mới</h2>
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="h-28 rounded-xl skeleton-shimmer" />
            ) : catches.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">Chưa có chiến tích mới.</p>
            ) : catches.map((item, index) => (
              <Link key={`${item.username}-${index}`} href={`/profile/${item.username}`} className="kinetic block rounded-xl bg-muted/55 p-3 hover:bg-muted">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold">{item.fish}</span>
                  <span className="shrink-0 text-xs font-bold text-primary">{item.weight}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Fish size={12} weight="duotone" /><span className="truncate">{item.angler}</span>
                  {item.location && <><span>·</span><MapPin size={12} weight="duotone" /><span className="truncate">{item.location}</span></>}
                </div>
              </Link>
            ))}
          </div>
        </section>

      </aside>
    </>
  )
}
