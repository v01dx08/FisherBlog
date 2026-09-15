"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { LeftSidebar } from "@/components/LeftSidebar"
import { RightSidebar } from "@/components/RightSidebar"
import { motion } from "framer-motion"
import { Camera, Compass, Fish, Hash, Loader2, LocateFixed, MapPin, MessageCircle, Play, Route, Sparkles, Trophy, Video, X } from "lucide-react"
import Link from "next/link"

const STATIC_CATEGORIES = [
  { id: "all", label: "Tất cả", icon: Sparkles },
  { id: "photo", label: "Ảnh", icon: Camera },
  { id: "video", label: "Video", icon: Video },
  { id: "big-catch", label: "Mẻ cá lớn", icon: Trophy },
  { id: "spots", label: "Điểm câu", icon: MapPin },
  { id: "technique", label: "Kỹ thuật", icon: Hash },
]

const TECHNIQUE_KEYWORDS = ["kỹ thuật", "ky thuat", "lure", "mồi", "moi", "setup", "câu đài", "cau dai", "kinh nghiệm", "kinh nghiem"]

function firstImageUrl(value) {
  if (!value) return null
  try {
    const images = JSON.parse(value)
    return Array.isArray(images) ? images[0] || null : value
  } catch {
    return value
  }
}

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMediaPost, setSelectedMediaPost] = useState(null)
  const [dynamicCategories, setDynamicCategories] = useState([])
  const [error, setError] = useState("")
  const [fishingSpots, setFishingSpots] = useState([])
  const [loadingFishingSpots, setLoadingFishingSpots] = useState(true)
  const [fishingSpotsError, setFishingSpotsError] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/posts").then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Không thể tải bài viết")
        return data
      }),
      fetch("/api/tags/trending").then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Không thể tải chủ đề")
        return data
      }),
    ])
      .then(([postsData, tagsData]) => {
        if (Array.isArray(postsData.items)) setPosts(postsData.items)
        if (Array.isArray(tagsData)) {
          setDynamicCategories(
            tagsData.slice(0, 4).map((t) => ({
              id: t.tag,
              label: t.label,
              tag: t.tag,
            }))
          )
        }
      })
      .catch((caught) => setError(caught.message || "Không thể tải nội dung khám phá"))
      .finally(() => setLoading(false))
  }, [])

  const CATEGORIES = [...STATIC_CATEGORIES, ...dynamicCategories]

  const loadFishingSpots = useCallback(async (params = new URLSearchParams({ q: "Hồ Trị An" })) => {
    setLoadingFishingSpots(true)
    setFishingSpotsError("")
    try {
      const nextParams = new URLSearchParams(params)
      if (!nextParams.has("radius")) nextParams.set("radius", "35000")
      const response = await fetch(`/api/fishing-spots?${nextParams.toString()}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể tải điểm câu.")
      setFishingSpots(Array.isArray(data.items) ? data.items : [])
    } catch (caught) {
      setFishingSpots([])
      setFishingSpotsError(caught.message || "Không thể tải điểm câu.")
    } finally {
      setLoadingFishingSpots(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const params = new URLSearchParams({ q: "Hồ Trị An", radius: "35000" })
    fetch(`/api/fishing-spots?${params.toString()}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Không thể tải điểm câu.")
        return data
      })
      .then((data) => {
        if (!active) return
        setFishingSpots(Array.isArray(data.items) ? data.items : [])
      })
      .catch((caught) => {
        if (!active) return
        setFishingSpots([])
        setFishingSpotsError(caught.message || "Không thể tải điểm câu.")
      })
      .finally(() => {
        if (active) setLoadingFishingSpots(false)
      })
    return () => { active = false }
  }, [])

  const useNearbySpots = () => {
    setFishingSpotsError("")
    if (!navigator.geolocation) {
      setFishingSpotsError("Trình duyệt không hỗ trợ lấy vị trí.")
      return
    }
    setLoadingFishingSpots(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadFishingSpots(new URLSearchParams({
          lat: String(position.coords.latitude),
          lon: String(position.coords.longitude),
        }))
      },
      () => {
        setLoadingFishingSpots(false)
        setFishingSpotsError("Không thể lấy vị trí. Hãy cho phép quyền vị trí rồi thử lại.")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const filteredPosts = posts.filter((post) => {
    if (activeCategory === "all") return post.imageUrl || post.videoUrl
    if (activeCategory === "photo") return !!post.imageUrl
    if (activeCategory === "video") return !!post.videoUrl
    if (activeCategory === "big-catch") return Number(post.weightKg || 0) >= 5
    if (activeCategory === "spots") return !!post.spotName
    if (activeCategory === "technique") {
      const text = `${post.content || ""} ${post.species || ""}`.toLowerCase()
      return TECHNIQUE_KEYWORDS.some((keyword) => text.includes(keyword))
    }
    const cat = CATEGORIES.find((c) => c.id === activeCategory)
    if (cat?.tag) {
      return post.content?.toLowerCase().includes(cat.tag.toLowerCase())
    }
    return true
  })

  const stats = useMemo(() => ({
    media: posts.filter((post) => post.imageUrl || post.videoUrl).length,
    videos: posts.filter((post) => post.videoUrl).length,
    spots: posts.filter((post) => post.spotName).length,
  }), [posts])

  return (
    <main id="main-content" className="h-[100dvh] w-full overflow-hidden bg-background">
      <Header />

      <div className="grid h-full w-full grid-cols-1 gap-5 overflow-hidden px-3 pb-[76px] pt-[76px] sm:px-5 md:pb-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,960px)_minmax(320px,1fr)] xl:grid-cols-[280px_minmax(24px,1fr)_minmax(0,960px)_minmax(24px,1fr)_320px] xl:gap-6 min-[2100px]:mx-auto min-[2100px]:max-w-[1580px]">
        <div className="hidden min-w-0 xl:col-start-1 xl:block"><LeftSidebar /></div>

        <section className="custom-scrollbar min-h-0 min-w-0 overflow-y-auto pb-20 pt-6 lg:col-start-2 xl:col-start-3">
          {/* Hero Banner */}
          <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-teal-900 to-emerald-950 p-6 text-white shadow-lg sm:p-8">
            <div className="relative z-10 max-w-xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                <Compass className="h-3.5 w-3.5 text-primary" />
                Khám phá mẻ câu, kỹ thuật và điểm câu
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Tìm cảm hứng cho chuyến câu tiếp theo
              </h1>
              <p className="text-xs leading-relaxed text-white/75 sm:text-sm">
                Xem ảnh, video, mẻ cá lớn và các điểm câu đang được cộng đồng FishViet chia sẻ.
              </p>
              <div className="mt-5 grid max-w-sm grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <p className="text-lg font-black">{stats.media}</p>
                  <p className="text-[10px] font-semibold uppercase text-white/60">Media</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <p className="text-lg font-black">{stats.videos}</p>
                  <p className="text-[10px] font-semibold uppercase text-white/60">Video</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <p className="text-lg font-black">{stats.spots}</p>
                  <p className="text-[10px] font-semibold uppercase text-white/60">Điểm câu</p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 flex w-1/3 items-center justify-center opacity-15">
              <Fish className="h-48 w-48 text-white" />
            </div>
          </div>

          <section className="social-card mb-5 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <MapPin className="h-4 w-4 text-primary" />
                  Điểm câu gợi ý
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Tìm hồ câu quanh bạn hoặc quanh Hồ Trị An.</p>
              </div>
              <button type="button" onClick={useNearbySpots} disabled={loadingFishingSpots} className="kinetic flex h-9 shrink-0 items-center gap-2 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50">
                {loadingFishingSpots ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                Gần tôi
              </button>
            </div>
            {fishingSpotsError ? (
              <p className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{fishingSpotsError}</p>
            ) : fishingSpots.length > 0 || loadingFishingSpots ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(loadingFishingSpots ? [0, 1, 2] : fishingSpots.slice(0, 3)).map((spot, index) => (
                  loadingFishingSpots ? (
                    <div key={index} className="h-24 rounded-2xl skeleton-shimmer" />
                  ) : (
                    <div key={spot.id} className="rounded-2xl bg-muted/45 p-3 ring-1 ring-border/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{spot.name}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{[spot.admin2, spot.admin1].filter(Boolean).join(", ") || spot.source}</p>
                        </div>
                        {typeof spot.distanceKm === "number" && <span className="shrink-0 rounded-full bg-primary/12 px-2 py-1 text-[10px] font-bold text-primary">{spot.distanceKm} km</span>}
                      </div>
                      <Link href={`/water-conditions?q=${encodeURIComponent(spot.name)}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                        <Route className="h-3.5 w-3.5" />
                        Xem điều kiện
                      </Link>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-muted/45 px-3 py-2 text-xs text-muted-foreground">
                Chưa có điểm câu gợi ý. Bấm Gần tôi để dò quanh vị trí hiện tại.
              </p>
            )}
          </section>

          {/* Categories bar */}
          <div className="custom-scrollbar mb-5 flex items-center gap-2 overflow-x-auto pb-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat.icon && <cat.icon className="h-3.5 w-3.5" />}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Media Masonry Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-64 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="social-card py-16 text-center" role="alert">
              <Fish className="mx-auto h-12 w-12 text-destructive/70" />
              <h2 className="mt-4 text-lg font-bold">Không thể tải mục khám phá</h2>
              <p className="mt-2 text-xs text-muted-foreground">{error}</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border/60 p-8">
              <Fish className="h-12 w-12 mx-auto text-primary/40 mb-3" />
              <h3 className="font-semibold text-lg">Chưa có mẻ câu nào ở mục này</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Hãy là người đầu tiên tải lên ảnh hoặc video clip mẻ câu!
              </p>
            </div>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {filteredPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedMediaPost(post)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedMediaPost(post) }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Xem media của ${post.author?.displayName || post.author?.username}`}
                  className="group relative mb-4 block break-inside-avoid overflow-hidden rounded-2xl bg-muted text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {/* Media display */}
                  {post.imageUrl ? (
                    <img
                      src={firstImageUrl(post.imageUrl)}
                      alt="Ảnh mẻ câu"
                      className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${i % 5 === 0 ? "h-80" : i % 3 === 0 ? "h-64" : "h-56"}`}
                    />
                  ) : post.videoUrl ? (
                    <div className={`relative flex w-full items-center justify-center bg-slate-950 ${i % 3 === 0 ? "h-72" : "h-56"}`}>
                      <video
                        src={post.videoUrl}
                        className="h-full w-full object-cover opacity-80"
                        muted
                      />
                      <div className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                        <Play className="h-5 w-5 ml-0.5" />
                      </div>
                    </div>
                  ) : null}

                  {/* Video Badge */}
                  {post.videoUrl && (
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                      <Video className="h-3 w-3 text-rose-400" />
                      <span>Video</span>
                    </div>
                  )}

                  <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
                    {post.species && <span className="rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">{post.species}</span>}
                    {post.weightKg && <span className="rounded-full bg-primary/90 px-2 py-1 text-[10px] font-bold text-primary-foreground">{post.weightKg} kg</span>}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4 text-white opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
                    <p className="mb-1.5 line-clamp-2 text-xs font-bold">{post.content}</p>
                    {post.spotName && <p className="mb-2 flex items-center gap-1 text-[11px] text-white/75"><MapPin className="h-3 w-3" />{post.spotName}</p>}
                    <div className="flex items-center justify-between text-[11px] text-white/80">
                      <span className="font-semibold">
                        {post.author?.displayName || post.author?.username}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Fish className="h-3 w-3 fill-sky-500 text-sky-500" />
                          {post.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.comments?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <div className="hidden min-w-0 justify-self-end lg:col-start-3 lg:block xl:col-start-5"><RightSidebar /></div>
      </div>

      {/* Media Detail Modal */}
      {selectedMediaPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết media"
          onKeyDown={(event) => { if (event.key === "Escape") setSelectedMediaPost(null) }}
          onClick={() => setSelectedMediaPost(null)}
        >
          <div
            className="bg-card max-w-2xl w-full rounded-3xl overflow-hidden border border-border/80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" autoFocus aria-label="Đóng chi tiết media" onClick={() => setSelectedMediaPost(null)} className="absolute right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"><X className="h-4 w-4" /></button>
            {selectedMediaPost.videoUrl ? (
              <video
                src={selectedMediaPost.videoUrl}
                controls
                autoPlay
                className="w-full max-h-[420px] bg-black object-contain"
              />
            ) : selectedMediaPost.imageUrl ? (
              <img
                src={firstImageUrl(selectedMediaPost.imageUrl)}
                alt="Ảnh mẻ câu"
                className="w-full max-h-[420px] object-cover"
              />
            ) : null}

            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Link
                  href={`/profile/${selectedMediaPost.author?.username}`}
                  className="font-bold text-sm hover:text-primary transition-colors"
                >
                  {selectedMediaPost.author?.displayName || selectedMediaPost.author?.username}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {new Date(selectedMediaPost.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-4">
                {selectedMediaPost.content}
              </p>
              <div className="flex justify-end gap-2">
                <Link
                  href={`/profile/${selectedMediaPost.author?.username}`}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Xem trang cá nhân cần thủ
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
