"use client"

import { useState, useEffect, use } from "react"
import { Header } from "@/components/Header"
import { LeftSidebar } from "@/components/LeftSidebar"
import { RightSidebar } from "@/components/RightSidebar"
import { PostCard } from "@/components/FeedComponents"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  ShieldCheck,
  MapPin,
  Fish,
  Calendar,
  Video,
  Globe,
  Share2,
  Edit3,
  FileText,
  MessageSquare,
} from "lucide-react"
import { motion } from "framer-motion"
import { OnboardingModal } from "@/components/OnboardingModal"
import { ChatCircle, UserPlus } from "@phosphor-icons/react"

export default function ProfilePage({ params }) {
  const resolvedParams = use(params)
  const username = resolvedParams.username

  const [profile, setProfile] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [error, setError] = useState("")
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      fetch(`/api/users/${username}`).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([profileData, userData]) => {
        if (!active) return
        if (profileData.error) setError(profileData.error)
        else setProfile(profileData)
        setCurrentUser(userData.user || null)
      })
      .catch(() => active && setError("Không thể tải hồ sơ người dùng."))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [username])

  const isOwner =
    currentUser &&
    profile &&
    currentUser.id === profile.id

  const initials = profile?.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : profile?.username?.slice(0, 2).toUpperCase() || "FB"

  const toggleFollow = async () => {
    const res = await fetch(`/api/users/${profile.username}/follow`, { method: "POST" })
    const data = await res.json()
    if (res.ok) {
      setProfile((current) => ({
        ...current,
        isFollowing: data.isFollowing,
        _count: { ...current._count, followers: data.followerCount },
      }))
    }
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    if (!messageText.trim()) return
    setSendingMessage(true)
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientUsername: profile.username, content: messageText }),
    })
    setSendingMessage(false)
    if (res.ok) {
      setMessageText("")
      setMessageOpen(false)
    }
  }

  return (
    <main id="main-content" className="h-[100dvh] w-full overflow-hidden bg-background">
      <Header />

      <div className="mx-auto grid h-full w-full max-w-[1580px] grid-cols-1 gap-5 overflow-hidden px-3 pb-[76px] pt-[76px] sm:px-5 md:pb-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,800px)_300px] xl:grid-cols-[280px_minmax(0,800px)_320px] xl:gap-6">
        <div className="hidden xl:block"><LeftSidebar /></div>

        <section className="custom-scrollbar min-h-0 min-w-0 overflow-y-auto pb-16 pt-4 lg:col-start-2">
          {loading ? (
            <div className="space-y-6 pt-8">
              <div className="h-44 rounded-3xl bg-muted animate-pulse" />
              <div className="h-32 rounded-2xl bg-card border border-border/60 animate-pulse" />
            </div>
          ) : error || !profile ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border/60 p-8 mt-6">
              <Fish className="h-12 w-12 mx-auto text-primary/40 mb-3" />
              <h2 className="text-xl font-bold">Không tìm thấy hồ sơ</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tài khoản cần thủ “{username}” không tồn tại hoặc đã bị thu hồi.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
                {/* Cover Banner */}
                <div className="h-40 bg-gradient-to-r from-sky-600 via-cyan-700 to-teal-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px]" />
                  <div className="absolute right-6 bottom-4 hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/40 sm:flex">
                    <ShieldCheck className="h-4 w-4" />
                    Bản gốc được Nhật ký ngày đi câu ghi nhận
                  </div>
                </div>

                {/* Profile Header Info */}
                <div className="relative px-4 pb-6 pt-0 sm:px-6">
                  <div className="-mt-14 mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-4">
                      <Avatar className="h-28 w-28 ring-4 ring-card shadow-xl">
                        {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.displayName || profile.username} className="object-cover" />}
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-3xl">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="mb-0 min-w-0 sm:mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="min-w-0 break-words text-2xl font-bold leading-tight">
                            {profile.displayName || profile.username}
                          </h1>
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"
                            title="Tài khoản Influencer đã xác minh quyền tác giả"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {profile.role === "ADMIN" ? "Quản trị viên" : "Influencer Đã Xác Minh"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">@{profile.username}</p>
                      </div>
                    </div>

                    {isOwner ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditModalOpen(true)}
                        className="self-start rounded-full gap-2 text-xs font-semibold sm:self-end"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Chỉnh sửa hồ sơ
                      </Button>
                    ) : currentUser ? (
                      <div className="flex gap-2 self-start sm:self-end">
                        <Button size="sm" variant="outline" onClick={() => setMessageOpen(true)} className="rounded-full gap-2 text-xs font-semibold">
                          <ChatCircle size={15} weight="light" /> Nhắn tin
                        </Button>
                        <Button size="sm" onClick={toggleFollow} className="rounded-full gap-2 text-xs font-semibold">
                          <UserPlus size={15} weight="light" /> {profile.isFollowing ? "Đang theo dõi" : "Theo dõi"}
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm text-foreground/90 leading-relaxed mb-4 max-w-2xl whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  )}

                  {/* Meta Chips */}
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-muted-foreground mb-5">
                    {profile.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.fishingStyle && (
                      <div className="flex items-center gap-1.5">
                        <Fish className="h-3.5 w-3.5 text-primary" />
                        <span>Sở trường: {profile.fishingStyle}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>
                        Tham gia: {new Date(profile.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  {/* External Social Platform Links */}
                  <div className="pt-4 border-t border-border/40">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Kênh Mạng Xã Hội Đã Liên Kết
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {profile.youtubeUrl ? (
                        <a
                          href={profile.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
                        >
                          <Video className="h-3.5 w-3.5" />
                          <span>Kênh YouTube</span>
                        </a>
                      ) : null}

                      {profile.tiktokUrl ? (
                        <a
                          href={profile.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold transition-colors"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          <span>Kênh TikTok</span>
                        </a>
                      ) : null}

                      {profile.facebookUrl ? (
                        <a
                          href={profile.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Trang Facebook</span>
                        </a>
                      ) : null}

                      {!profile.youtubeUrl && !profile.tiktokUrl && !profile.facebookUrl && (
                        <span className="text-xs text-muted-foreground italic">
                          Chưa cập nhật liên kết mạng xã hội.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Summary Bar */}
                <div className="grid grid-cols-4 border-t border-border/40 bg-muted/20 divide-x divide-border/40 text-center py-3">
                  <div>
                    <span className="text-xl font-bold text-foreground">
                      {profile.posts?.length || 0}
                    </span>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-[11px]">
                      Bài viết gốc
                    </p>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-foreground">
                      {profile._count?.comments || 0}
                    </span>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-[11px]">
                      Lượt phản hồi
                    </p>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-foreground">{profile._count?.followers || 0}</span>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-[11px]">Người theo dõi</p>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-foreground">{profile._count?.following || 0}</span>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-[11px]">Đang theo dõi</p>
                  </div>
                </div>
              </div>

              {/* Posts section header */}
              <div className="flex items-center gap-2 px-1 pt-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold">Bài viết đã đăng tải</h2>
                <span className="text-xs text-muted-foreground">
                  ({profile.posts?.length || 0})
                </span>
              </div>

              {/* Influencer's Posts */}
              <div className="space-y-4">
                {profile.posts?.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-2xl border border-border/60 p-6">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Influencer này chưa đăng tải bài viết nào.
                    </p>
                  </div>
                ) : (
                  profile.posts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <PostCard
                        author={{
                          id: post.author?.id || profile.id,
                          username: post.author?.username || profile.username,
                          displayName: post.author?.displayName || profile.displayName,
                          role: post.author?.role || profile.role,
                          avatarUrl: post.author?.avatarUrl || profile.avatarUrl,
                        }}
                        time={post.createdAt}
                        content={post.content}
                        image={post.imageUrl}
                        videoUrl={post.videoUrl}
                        species={post.species}
                        weightKg={post.weightKg}
                        spotName={post.spotName}
                        proofHash={post.proofHash}
                        proofIssuedAt={post.proofIssuedAt}
                        initialLikes={post.likeCount}
                        initialIsLiked={post.isLiked}
                        initialIsBookmarked={post.isBookmarked}
                        initialComments={post.comments || []}
                        postId={post.id}
                        currentUser={currentUser}
                      />
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        <div className="hidden lg:block lg:col-start-3"><RightSidebar /></div>
      </div>

      {profile && (
        <OnboardingModal
          isOpen={editModalOpen}
          user={profile}
          onClose={() => setEditModalOpen(false)}
          onComplete={(updated) => {
            setProfile((prev) => ({ ...prev, ...updated }))
            setEditModalOpen(false)
          }}
        />
      )}

      {messageOpen && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="message-dialog-title" onKeyDown={(event) => { if (event.key === "Escape") setMessageOpen(false) }} onClick={() => setMessageOpen(false)}>
          <form onSubmit={sendMessage} onClick={(event) => event.stopPropagation()} className="bezel w-full max-w-md">
            <div className="bezel-core p-6">
              <h2 id="message-dialog-title" className="text-xl font-semibold">Nhắn cho {profile.displayName || profile.username}</h2>
              <textarea autoFocus value={messageText} onChange={(event) => setMessageText(event.target.value)} maxLength={2000} placeholder="Viết tin nhắn..." className="mt-5 min-h-32 w-full resize-none rounded-[1.25rem] bg-muted p-4 text-sm outline-none" />
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setMessageOpen(false)} className="rounded-full">Hủy</Button>
                <Button type="submit" disabled={sendingMessage || !messageText.trim()} className="rounded-full">{sendingMessage ? "Đang gửi..." : "Gửi tin nhắn"}</Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
