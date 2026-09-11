"use client"

import { BookmarkSimple, Fish, Hash, MagnifyingGlass, X } from "@phosphor-icons/react"
import Link from "next/link"
import { useState } from "react"
import { CreatePostBox, PostCard } from "@/components/FeedComponents"
import { Header } from "@/components/Header"
import { LeftSidebar } from "@/components/LeftSidebar"
import { OnboardingModal } from "@/components/OnboardingModal"
import { RightSidebar } from "@/components/RightSidebar"

export function FeedPageClient({ initialPosts, initialCursor, initialUser, tag, query, saved }) {
  const [posts, setPosts] = useState(initialPosts)
  const [currentUser, setCurrentUser] = useState(initialUser)
  const [nextCursor, setNextCursor] = useState(initialCursor)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [composeOpen, setComposeOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(Boolean(
    initialUser && initialUser.role === "INFLUENCER" && !initialUser.isProfileCompleted
  ))

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    setLoadError("")
    const params = new URLSearchParams({ cursor: nextCursor, limit: "10" })
    if (tag) params.set("tag", tag)
    if (query) params.set("q", query)
    if (saved) params.set("saved", "true")

    try {
      const response = await fetch(`/api/posts?${params}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể tải thêm nhật ký")
      setPosts((items) => [...items, ...(data.items || [])])
      setNextCursor(data.nextCursor || null)
    } catch (caught) {
      setLoadError(caught.message || "Không thể tải thêm nhật ký")
    } finally {
      setLoadingMore(false)
    }
  }

  const filter = tag
    ? { icon: Hash, text: `Chủ đề #${tag}` }
    : query
      ? { icon: MagnifyingGlass, text: `Kết quả cho “${query}”` }
      : saved
        ? { icon: BookmarkSimple, text: "Nhật ký đã lưu" }
        : null

  return (
    <main id="main-content" className="h-[100dvh] w-full overflow-hidden bg-background">
      <Header onNewPostClick={() => setComposeOpen(true)} />
      <div className="grid h-full w-full grid-cols-1 gap-5 overflow-hidden px-3 pb-[76px] pt-[76px] sm:px-5 md:pb-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,680px)_minmax(320px,1fr)] xl:grid-cols-[280px_minmax(24px,1fr)_minmax(0,680px)_minmax(24px,1fr)_320px] xl:gap-6 min-[2100px]:mx-auto min-[2100px]:max-w-[1480px]">
        <div className="hidden min-w-0 xl:col-start-1 xl:block"><LeftSidebar /></div>
        <section className="custom-scrollbar min-h-0 min-w-0 overflow-y-auto pb-8 lg:col-start-2 xl:col-start-3">
          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <h1 className="text-xl font-bold tracking-[-0.025em] sm:text-2xl">{filter ? filter.text : "Bảng tin cộng đồng"}</h1>
              <p className="mt-1 text-xs text-muted-foreground">Mẻ câu, kỹ thuật và câu chuyện mới nhất từ mặt nước.</p>
            </div>
            {filter && <Link href="/" aria-label="Xóa bộ lọc" className="kinetic flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary"><X size={16} weight="bold" /></Link>}
          </div>
          {!saved && (
            <CreatePostBox
              currentUser={currentUser}
              onRequestCompose={() => setComposeOpen(true)}
            />
          )}
          {posts.length === 0 ? (
            <div className="social-card flex min-h-72 flex-col items-center justify-center p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary"><Fish size={28} weight="duotone" /></span>
              <h2 className="mt-5 text-lg font-bold">Chưa có nhật ký phù hợp</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Đổi bộ lọc hoặc chia sẻ mẻ câu đầu tiên với cộng đồng.</p>
            </div>
          ) : posts.map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              author={post.author}
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
              initialComments={post.comments}
              currentUser={currentUser}
              onPostDeleted={(id) => setPosts((items) => items.filter((item) => item.id !== id))}
            />
          ))}
          {loadError && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-center text-xs text-destructive">{loadError}</p>}
          {nextCursor && <button type="button" disabled={loadingMore} onClick={loadMore} className="kinetic mx-auto flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50">{loadingMore ? "Đang tải..." : "Xem thêm nhật ký"}</button>}
        </section>
        <div className="hidden min-w-0 justify-self-end lg:col-start-3 lg:block xl:col-start-5"><RightSidebar /></div>
      </div>
      {currentUser && (
        <OnboardingModal
          isOpen={showOnboarding}
          user={currentUser}
          onComplete={(user) => { setCurrentUser(user); setShowOnboarding(false) }}
          onClose={() => setShowOnboarding(false)}
        />
      )}
      {composeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-md sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Viết bài"
          onClick={() => setComposeOpen(false)}
          onKeyDown={(event) => { if (event.key === "Escape") setComposeOpen(false) }}
        >
          <div className="custom-scrollbar max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between px-1 text-foreground">
              <h2 className="text-base font-bold">Viết bài</h2>
              <button type="button" onClick={() => setComposeOpen(false)} className="kinetic flex h-9 w-9 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border/70 hover:text-foreground" aria-label="Đóng viết bài">
                <X size={17} weight="bold" />
              </button>
            </div>
            <CreatePostBox
              currentUser={currentUser}
              startExpanded
              hideTrigger
              onCancel={() => setComposeOpen(false)}
              onPostCreated={(post) => {
                setPosts((items) => [post, ...items])
                setComposeOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </main>
  )
}
