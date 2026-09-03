"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  BookmarkSimple,
  Compass,
  Fish,
  Gear,
  House,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  SignIn,
  SignOut,
  UserCircle,
} from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessagesDropdown } from "@/components/MessagesDropdown"
import { NotificationsDropdown } from "@/components/NotificationsDropdown"
import { SearchSuggestions } from "@/components/SearchSuggestions"
import { SettingsModal } from "@/components/SettingsModal"
import { ThemeToggle } from "@/components/ThemeToggle"

const navigation = [
  { label: "Bảng tin", href: "/", icon: House, match: "home" },
  { label: "Khám phá", href: "/explore", icon: Compass, match: "explore" },
  { label: "Đã lưu", href: "/?saved=true", icon: BookmarkSimple, match: "saved" },
]

export function Header({ onNewPostClick }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const profileRef = useRef(null)
  const searchRef = useRef(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let active = true
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => active && setCurrentUser(data.user || null))
      .catch(() => active && setCurrentUser(null))
    return () => { active = false }
  }, [])

  useEffect(() => {
    const close = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false)
      if (searchRef.current && !searchRef.current.contains(event.target)) setSuggestionsOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const submitSearch = (event) => {
    event.preventDefault()
    const query = searchKeyword.trim()
    setSuggestionsOpen(false)
    router.push(query ? `/?q=${encodeURIComponent(query)}` : "/")
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setCurrentUser(null)
    setProfileOpen(false)
    router.push("/login")
    router.refresh()
  }

  const isActive = (item) => {
    if (item.match === "explore") return pathname === "/explore"
    if (item.match === "saved") return false
    return pathname === "/"
  }

  const initials = (currentUser?.displayName || currentUser?.username || "NK").slice(0, 2).toUpperCase()

  return (
    <>
      <header className="app-header fixed inset-x-0 top-0 z-40 h-16">
        <div className="mx-auto grid h-full max-w-[1480px] grid-cols-[1fr_auto] items-center gap-3 px-3 sm:px-5 md:grid-cols-[minmax(260px,1fr)_auto_minmax(260px,1fr)]">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link href="/" aria-label="FishViet" className="kinetic flex shrink-0 items-center gap-2 rounded-xl p-1 text-foreground hover:bg-muted">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_28px_rgba(34,139,230,0.24)]">
                <Fish size={22} weight="duotone" />
              </span>
              <span className="hidden text-sm font-extrabold tracking-[-0.035em] xl:block">FishViet</span>
            </Link>

            <div ref={searchRef} className="relative hidden w-full max-w-[290px] sm:block">
              <form onSubmit={submitSearch}>
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} weight="bold" />
                <input
                  type="search"
                  value={searchKeyword}
                  onFocus={() => setSuggestionsOpen(true)}
                  onChange={(event) => {
                    setSearchKeyword(event.target.value)
                    setSuggestionsOpen(true)
                  }}
                  placeholder="Tìm kiếm trên FishViet"
                  aria-label="Tìm kiếm"
                  className="h-10 w-full rounded-full bg-muted/85 pl-10 pr-4 text-sm outline-none ring-1 ring-transparent placeholder:text-muted-foreground focus:bg-card focus:ring-primary/45"
                />
              </form>
              <SearchSuggestions query={searchKeyword} isOpen={suggestionsOpen} onClose={() => setSuggestionsOpen(false)} />
            </div>
          </div>

          <nav className="hidden h-full items-stretch md:flex" aria-label="Điều hướng chính">
            {navigation.map((item) => {
              const active = isActive(item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className={`kinetic relative flex w-24 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/75 hover:text-foreground lg:w-28 ${active ? "text-primary" : ""}`}
                >
                  <item.icon size={25} weight={active ? "fill" : "regular"} />
                  {active && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-primary" />}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center justify-end gap-1">
            {currentUser && onNewPostClick && (
              <button type="button" onClick={onNewPostClick} className="kinetic hidden h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-[0_8px_26px_rgba(34,139,230,0.2)] hover:bg-primary/90 active:scale-[0.98] lg:flex">
                <Plus size={16} weight="bold" /> Viết bài
              </button>
            )}

            {currentUser && <MessagesDropdown />}
            {currentUser && <NotificationsDropdown />}
            <ThemeToggle />

            {currentUser ? (
              <div ref={profileRef} className="relative">
                <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label="Mở menu tài khoản" className="kinetic rounded-full p-0.5 hover:bg-muted">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/30">
                    <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                      className="social-popover absolute right-0 mt-2 w-64 p-2"
                    >
                      <div className="mb-1 rounded-xl bg-muted/55 px-3 py-3">
                        <p className="truncate text-sm font-bold">{currentUser.displayName || currentUser.username}</p>
                        <p className="truncate text-xs text-muted-foreground">@{currentUser.username}</p>
                      </div>
                      <Link href={`/profile/${currentUser.username}`} onClick={() => setProfileOpen(false)} className="kinetic flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                        <UserCircle size={19} weight="duotone" /> Hồ sơ
                      </Link>
                      {currentUser.role === "ADMIN" && (
                        <Link href="/admin" onClick={() => setProfileOpen(false)} className="kinetic flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                          <ShieldCheck size={19} weight="duotone" /> Quản trị
                        </Link>
                      )}
                      <button type="button" onClick={() => { setProfileOpen(false); setSettingsOpen(true) }} className="kinetic flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                        <Gear size={19} weight="duotone" /> Cài đặt
                      </button>
                      <button type="button" onClick={logout} className="kinetic flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10">
                        <SignOut size={19} weight="duotone" /> Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="kinetic flex h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.98]">
                <SignIn size={17} weight="bold" /> <span className="hidden sm:inline">Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav className="app-header fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 px-2 md:hidden" aria-label="Điều hướng di động">
        {navigation.slice(0, 2).map((item) => {
          const active = isActive(item)
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
              <item.icon size={22} weight={active ? "fill" : "regular"} /> {item.label}
            </Link>
          )
        })}
        <button type="button" onClick={onNewPostClick} disabled={!onNewPostClick} className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-primary disabled:text-muted-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Plus size={18} weight="bold" /></span>
          Viết bài
        </button>
        <Link href="/?saved=true" className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${isActive(navigation[2]) ? "text-primary" : "text-muted-foreground"}`}>
          <BookmarkSimple size={22} weight={isActive(navigation[2]) ? "fill" : "regular"} /> Đã lưu
        </Link>
      </nav>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
