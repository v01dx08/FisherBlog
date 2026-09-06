"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Fish, MessageCircle, ShieldCheck, UserPlus, Check, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

const ICON_MAP = {
  like: Fish,
  comment: MessageCircle,
  follow: UserPlus,
  system: ShieldCheck,
}

const COLOR_MAP = {
  like: "text-rose-500 bg-rose-500/10",
  comment: "text-blue-500 bg-blue-500/10",
  follow: "text-emerald-500 bg-emerald-500/10",
  system: "text-primary bg-primary/10",
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  const now = new Date()
  const diffMinutes = Math.floor((now - date) / (1000 * 60))
  if (diffMinutes < 1) return "Vừa xong"
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString("vi-VN")
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    const next = !isOpen
    setIsOpen(next)
    if (next) fetchNotifications()
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // silent fail
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <h3 className="font-bold text-sm">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                >
                  <Check className="h-3 w-3" />
                  Đọc tất cả
                </button>
              )}
            </div>

            {/* Body */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Chưa có thông báo nào
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = ICON_MAP[notif.type] || Bell
                  const colorClass = COLOR_MAP[notif.type] || "text-primary bg-primary/10"
                  const actorName = notif.actor?.displayName || notif.actor?.username || "Hệ thống"
                  const actorInitials = actorName.slice(0, 2).toUpperCase()
                  const link = notif.type === "follow" && notif.actor?.username
                    ? `/profile/${notif.actor.username}`
                    : notif.postId
                    ? `/post/${notif.postId}`
                    : "#"

                  return (
                    <Link
                      key={notif.id}
                      href={link}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/60 transition-colors border-b border-border/20 last:border-0 ${
                        !notif.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-9 w-9">
                          {notif.actor?.avatarUrl && <AvatarImage src={notif.actor.avatarUrl} alt={actorName} className="object-cover" />}
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {actorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center ${colorClass}`}>
                          <Icon className="h-2.5 w-2.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed">
                          <span className="font-bold">{actorName}</span>{" "}
                          <span className="text-muted-foreground">{notif.content.replace(actorName, "").trim()}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatTimeAgo(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </Link>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
