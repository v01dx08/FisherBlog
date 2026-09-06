"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Hash, User, FileText, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

export function SearchSuggestions({ query = "", isOpen, onClose }) {
  const [matchingAnglers, setMatchingAnglers] = useState([])
  const [matchingTags, setMatchingTags] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const q = query.trim()
      if (!q) {
        // When empty, load trending tags as default suggestions
        fetch("/api/tags/trending")
          .then((r) => r.json())
          .then((tags) => {
            if (Array.isArray(tags)) setMatchingTags(tags.slice(0, 4))
          })
          .catch(() => {})

        fetch("/api/users/suggested")
          .then((r) => r.json())
          .then((users) => {
            if (Array.isArray(users)) {
              setMatchingAnglers(
                users.slice(0, 3).map((u) => ({
                  username: u.username,
                  name: u.name,
                  avatarUrl: u.avatarUrl,
                  location: u.specialty || "",
                }))
              )
            }
          })
          .catch(() => {})
        return
      }

      setLoading(true)
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => {
          setMatchingAnglers(data.users || [])
          setMatchingTags(data.tags || [])
        })
        .catch(() => {
          setMatchingAnglers([])
          setMatchingTags([])
        })
        .finally(() => setLoading(false))
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.15 }}
        className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden z-50 p-2 text-xs"
      >
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}

        {/* Anglers section */}
        {!loading && matchingAnglers.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <User className="h-3 w-3 text-primary" />
              <span>Cần thủ</span>
            </div>
            <div className="space-y-0.5">
              {matchingAnglers.map((angler) => (
                <Link
                  key={angler.username}
                  href={`/profile/${angler.username}`}
                  onClick={onClose}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/80 transition-colors group"
                >
                  <Avatar className="h-7 w-7">
                    {angler.avatarUrl && <AvatarImage src={angler.avatarUrl} alt={angler.name || angler.username} className="object-cover" />}
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                      {(angler.name || angler.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {angler.name || angler.username}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{angler.location}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tags section */}
        {!loading && matchingTags.length > 0 && (
          <div className="mb-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Hash className="h-3 w-3 text-primary" />
              <span>Chủ đề nổi bật</span>
            </div>
            <div className="grid grid-cols-2 gap-1 px-1">
              {matchingTags.map((item) => (
                <Link
                  key={item.tag}
                  href={`/?tag=${encodeURIComponent(item.tag)}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors group"
                >
                  <span className="font-semibold truncate">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">{item.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && matchingAnglers.length === 0 && matchingTags.length === 0 && query.trim() && (
          <div className="text-center py-4 text-muted-foreground">
            Không tìm thấy kết quả phù hợp
          </div>
        )}

        {/* Search all fallback button */}
        {query.trim() && (
          <div className="pt-1.5 mt-1.5 border-t border-border/40">
            <Link
              href={`/?q=${encodeURIComponent(query.trim())}`}
              onClick={onClose}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-muted font-semibold text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                <span>Tìm kiếm tất cả bài viết chứa &quot;{query}&quot;</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
