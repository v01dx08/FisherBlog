"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Send, ArrowLeft, CheckCheck, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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

export function MessagesDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [selectedConvId, setSelectedConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(false)
  const [sendingMsg, setSendingMsg] = useState(false)
  const dropdownRef = useRef(null)
  const messagesEndRef = useRef(null)

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
        setSelectedConvId(null)
        setMessages([])
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/messages")
      const data = await res.json()
      if (Array.isArray(data)) setConversations(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`/api/messages/${convId}`)
      const data = await res.json()
      if (Array.isArray(data)) setMessages(data)
    } catch {
      // silent
    }
  }

  const handleToggle = () => {
    const next = !isOpen
    setIsOpen(next)
    if (next) fetchConversations()
    else {
      setSelectedConvId(null)
      setMessages([])
    }
  }

  const handleSelectConversation = (convId) => {
    setSelectedConvId(convId)
    fetchMessages(convId)
    // Mark as read locally
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread: 0 } : c))
    )
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedConvId || sendingMsg) return

    setSendingMsg(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          content: inputText.trim(),
        }),
      })
      const newMsg = await res.json()
      if (res.ok) {
        setMessages((prev) => [...prev, newMsg])
        setInputText("")
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 50)
      }
    } catch {
      // silent
    } finally {
      setSendingMsg(false)
    }
  }

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const selectedConv = conversations.find((c) => c.id === selectedConvId)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Tin nhắn"
      >
        <MessageCircle className="h-5 w-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {totalUnread > 9 ? "9+" : totalUnread}
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
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
              {selectedConvId && (
                <button
                  onClick={() => {
                    setSelectedConvId(null)
                    setMessages([])
                  }}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <h3 className="font-bold text-sm flex-1">
                {selectedConv ? (selectedConv.otherUser.displayName || selectedConv.otherUser.username) : "Tin nhắn"}
              </h3>
            </div>

            {/* Body */}
            {!selectedConvId ? (
              // Conversation list
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Chưa có cuộc trò chuyện nào
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const other = conv.otherUser
                    const initials = (other.displayName || other.username || "??").slice(0, 2).toUpperCase()
                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left border-b border-border/20 last:border-0 ${
                          conv.unread > 0 ? "bg-primary/5" : ""
                        }`}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm truncate ${conv.unread > 0 ? "font-bold" : "font-medium"}`}>
                              {other.displayName || other.username}
                            </span>
                            {conv.lastMessage && (
                              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                {formatTimeAgo(conv.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          {conv.lastMessage && (
                            <p className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {conv.unread > 0 && (
                          <div className="h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shrink-0">
                            {conv.unread}
                          </div>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            ) : (
              // Chat view
              <>
                <div className="h-64 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2.5">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      Bắt đầu cuộc trò chuyện...
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender?.id !== selectedConv?.otherUser?.id
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                          >
                            {msg.content}
                            <div className={`flex items-center gap-1 mt-1 text-[9px] ${isMine ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"}`}>
                              <span>{formatTimeAgo(msg.createdAt)}</span>
                              {isMine && msg.isRead && <CheckCheck className="h-2.5 w-2.5" />}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 px-3 py-2 border-t border-border/40">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 h-8 px-3 rounded-full bg-muted text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={sendingMsg}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sendingMsg}
                    className="p-1.5 rounded-full text-primary hover:bg-primary/10 disabled:opacity-30 transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
