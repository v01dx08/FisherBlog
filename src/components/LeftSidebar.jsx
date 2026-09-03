"use client"

import {
  BookmarkSimple,
  Compass,
  Fish,
  Gear,
  Hash,
  House,
  Scales,
  ShieldCheck,
  TrendUp,
  UserCircle,
} from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { SettingsModal } from "@/components/SettingsModal"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function LeftSidebar() {
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [trendingTags, setTrendingTags] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetch("/api/tags/trending").then((response) => response.json()),
      fetch("/api/auth/me").then((response) => response.json()),
    ]).then(([tags, userData]) => {
      if (!active) return
      if (Array.isArray(tags)) setTrendingTags(tags.slice(0, 6))
      setCurrentUser(userData.user || null)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const navItems = [
    { name: "Bảng tin", icon: House, href: "/", active: pathname === "/" },
    { name: "Khám phá", icon: Compass, href: "/explore", active: pathname === "/explore" },
    { name: "Nhật ký đã lưu", icon: BookmarkSimple, href: "/?saved=true", active: false },
    ...(currentUser?.role === "ADMIN" ? [{ name: "Quản trị", icon: ShieldCheck, href: "/admin", active: pathname === "/admin" }] : []),
    { name: "Pháp lý & bản quyền", icon: Scales, href: "/legal", active: pathname === "/legal" },
  ]

  const initials = (currentUser?.displayName || currentUser?.username || "NK").slice(0, 2).toUpperCase()

  return (
    <>
      <aside className="hidden h-full w-[280px] shrink-0 flex-col overflow-hidden pr-2 xl:flex">
        {currentUser ? (
          <Link href={`/profile/${currentUser.username}`} className="kinetic mb-3 flex items-center gap-3 rounded-xl p-3 hover:bg-muted/75">
            <Avatar className="h-10 w-10 ring-2 ring-primary/25">
              <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{currentUser.displayName || currentUser.username}</p>
              <p className="truncate text-xs text-muted-foreground">Xem trang cá nhân</p>
            </div>
          </Link>
        ) : (
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/45 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-primary"><UserCircle size={23} weight="duotone" /></span>
            <div><p className="text-sm font-bold">Khách ghé thăm</p><Link href="/login" className="text-xs font-semibold text-primary hover:underline">Đăng nhập để tương tác</Link></div>
          </div>
        )}

        <nav className="space-y-1" aria-label="Lối tắt">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className={`kinetic group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${item.active ? "bg-primary/14 text-primary" : "text-foreground/85 hover:bg-muted/75"}`}>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary"}`}>
                <item.icon size={19} weight={item.active ? "fill" : "duotone"} />
              </span>
              {item.name}
            </Link>
          ))}
          <button type="button" onClick={() => setSettingsOpen(true)} className="kinetic group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-foreground/85 hover:bg-muted/75">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:text-primary"><Gear size={19} weight="duotone" /></span>
            Cài đặt
          </button>
        </nav>

        <div className="my-5 h-px bg-border/70" />

        <section className="px-3">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <TrendUp size={16} weight="bold" className="text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-[0.12em]">Đang được quan tâm</h2>
          </div>
          <div className="space-y-1">
            {trendingTags.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">Chưa có chủ đề mới.</p>
            ) : trendingTags.map((item) => (
              <Link key={item.tag} href={`/?tag=${encodeURIComponent(item.tag)}`} className="kinetic flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted/75 hover:text-primary">
                <span className="flex min-w-0 items-center gap-2 font-medium"><Hash size={14} weight="bold" /><span className="truncate">{item.label}</span></span>
                <span className="text-[11px] text-muted-foreground">{item.count}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-auto px-3 pt-6 text-[11px] leading-5 text-muted-foreground/75">
          <div className="mb-2 flex items-center gap-2 font-semibold text-foreground/65"><Fish size={14} weight="duotone" /> FishViet.vn 2026</div>
          <div className="flex flex-wrap gap-x-3"><Link href="/legal" className="hover:underline">Điều khoản</Link><Link href="/legal" className="hover:underline">Riêng tư</Link></div>
        </div>
      </aside>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
