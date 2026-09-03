"use client"

import { useState, useEffect, Suspense } from "react"
import { Header } from "@/components/Header"
import { LeftSidebar } from "@/components/LeftSidebar"
import { RightSidebar } from "@/components/RightSidebar"
import { motion, AnimatePresence } from "framer-motion"
import { Compass, Video, Fish, MapPin, Heart, MessageCircle, Play, Eye } from "lucide-react"
import Link from "next/link"

const STATIC_CATEGORIES = [
  { id: "all", label: "Tất cả mẻ câu" },
  { id: "video", label: "Có Video clip", icon: Video },
]

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

  useEffect(() => {
    Promise.all([
      fetch("/api/posts").then((r) => r.json()),
      fetch("/api/tags/trending").then((r) => r.json()),
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
      .catch((err) => console.error("Explore fetch error:", err))
      .finally(() => setLoading(false))
  }, [])

  const CATEGORIES = [...STATIC_CATEGORIES, ...dynamicCategories]

  const filteredPosts = posts.filter((post) => {
    if (activeCategory === "all") return post.imageUrl || post.videoUrl
    if (activeCategory === "video") return !!post.videoUrl
    const cat = CATEGORIES.find((c) => c.id === activeCategory)
    if (cat?.tag) {
      return post.content?.toLowerCase().includes(cat.tag.toLowerCase())
    }
    return true
  })

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      <div className="flex justify-center mx-auto max-w-[1600px] pt-20">
        <LeftSidebar />

        <main className="flex-1 max-w-[960px] w-full mt-6 px-4 sm:px-6 pb-20 shrink-0">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-sky-900 via-teal-900 to-emerald-950 rounded-3xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white/90 font-semibold mb-3">
                <Compass className="h-3.5 w-3.5 text-primary" />
                Khám phá & Học hỏi kinh nghiệm
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Bộ Sưu Tập Mẻ Câu & Kỹ Thuật Đỉnh Cao
              </h1>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Chiêm ngưỡng những khoảnh khắc kéo cá thót tim, video clip săn mồi và toạ độ điểm câu ấn tượng nhất từ cộng đồng cần thủ Việt Nam.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
              <Fish className="h-48 w-48 text-white" />
            </div>
          </div>

          {/* Categories bar */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-3 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
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
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border/60 p-8">
              <Fish className="h-12 w-12 mx-auto text-primary/40 mb-3" />
              <h3 className="font-semibold text-lg">Chưa có mẻ câu nào ở mục này</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Hãy là người đầu tiên tải lên ảnh hoặc video clip mẻ câu!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedMediaPost(post)}
                  className="group relative rounded-2xl overflow-hidden bg-muted aspect-[4/3] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Media display */}
                  {post.imageUrl ? (
                    <img
                      src={firstImageUrl(post.imageUrl)}
                      alt="Ảnh mẻ câu"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : post.videoUrl ? (
                    <div className="w-full h-full bg-slate-950 flex items-center justify-center relative">
                      <video
                        src={post.videoUrl}
                        className="w-full h-full object-cover opacity-80"
                        muted
                      />
                      <div className="absolute h-12 w-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 ml-0.5" />
                      </div>
                    </div>
                  ) : null}

                  {/* Video Badge */}
                  {post.videoUrl && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 z-10">
                      <Video className="h-3 w-3 text-rose-400" />
                      <span>Video</span>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                    <p className="text-xs font-bold line-clamp-2 mb-1.5">{post.content}</p>
                    <div className="flex items-center justify-between text-[11px] text-white/80">
                      <span className="font-semibold">
                        {post.author?.displayName || post.author?.username}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
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
        </main>

        <RightSidebar />
      </div>

      {/* Media Detail Modal */}
      {selectedMediaPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
          onClick={() => setSelectedMediaPost(null)}
        >
          <div
            className="bg-card max-w-2xl w-full rounded-3xl overflow-hidden border border-border/80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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
    </div>
  )
}
