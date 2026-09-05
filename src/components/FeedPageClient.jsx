"use client"

import { BookmarkSimple, Fish, Hash, MagnifyingGlass, X } from "@phosphor-icons/react"
import Link from "next/link"
import { useRef, useState } from "react"
import { CreatePostBox, PostCard } from "@/components/FeedComponents"
import { Header } from "@/components/Header"
import { LeftSidebar } from "@/components/LeftSidebar"
import { OnboardingModal } from "@/components/OnboardingModal"
import { RightSidebar } from "@/components/RightSidebar"

export function FeedPageClient({ initialPosts, initialCursor, initialUser, tag, query, saved }) {
  const composerRef = useRef(null)
  const [posts, setPosts] = useState(initialPosts)
  const [currentUser, setCurrentUser] = useState(initialUser)
  const [nextCursor, setNextCursor] = useState(initialCursor)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState("")
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
      <Header onNewPostClick={() => composerRef.current?.scrollTo({ top: 0, behavior: "smooth" })} />
      <div className="mx-auto grid h-full w-full max-w-[1480px] grid-cols-1 gap-5 overflow-hidden px-3 pb-[76px] pt-[76px] sm:px-5 md:pb-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,680px)_300px] xl:grid-cols-[280px_minmax(0,680px)_320px] xl:gap-6">
        <div className="hidden xl:block"><LeftSidebar /></div>
        <section ref={composerRef} className="custom-scrollbar min-h-0 min-w-0 overflow-y-auto pb-8 lg:col-start-2">
          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <h1 className="text-xl font-bold tracking-[-0.025em] sm:text-2xl">{filter ? filter.text : "Bảng tin cộng đồng"}</h1>
              <p className="mt-1 text-xs text-muted-foreground">Mẻ câu, kỹ thuật và câu chuyện mới nhất từ mặt nước.</p>
            </div>
            {filter && <Link href="/" aria-label="Xóa bộ lọc" className="kinetic flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary"><X size={16} weight="bold" /></Link>}
          </div>
          {!saved && <CreatePostBox currentUser={currentUser} onPostCreated={(post) => setPosts((items) => [post, ...items])} />}
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
        <div className="hidden lg:block lg:col-start-3"><RightSidebar /></div>
      </div>
      {currentUser && <OnboardingModal isOpen={showOnboarding} user={currentUser} onComplete={(user) => { setCurrentUser(user); setShowOnboarding(false) }} />}
    </main>
  )
}
