"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, CheckCheck, Loader2, MessageCircle, Send } from "lucide-react"
import { Header } from "@/components/Header"
import { LeftSidebar } from "@/components/LeftSidebar"
import { RightSidebar } from "@/components/RightSidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function formatTimeAgo(dateString) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ""
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (diffMinutes < 1) return "Vừa xong"
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString("vi-VN")
}

export function MessagesPageClient({ currentUser }) {
  const [conversations, setConversations] = useState([])
  const [selectedConvId, setSelectedConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef(null)

  const selectedConv = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConvId) || null,
    [conversations, selectedConvId]
  )

  useEffect(() => {
    let active = true
    fetch("/api/messages")
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Không thể tải tin nhắn")
        return data
      })
      .then((data) => {
        if (!active) return
        setConversations(Array.isArray(data) ? data : [])
        if (data?.[0]?.id) {
          setLoadingMessages(true)
          setSelectedConvId((current) => current || data[0].id)
        }
      })
      .catch((caught) => active && setError(caught.message || "Không thể tải tin nhắn"))
      .finally(() => active && setLoadingConversations(false))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedConvId) {
      return
    }

    let active = true
    fetch(`/api/messages/${selectedConvId}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Không thể tải cuộc trò chuyện")
        return data
      })
      .then((data) => {
        if (!active) return
        setMessages(Array.isArray(data) ? data : [])
        setConversations((items) =>
          items.map((item) => item.id === selectedConvId ? { ...item, unread: 0 } : item)
        )
      })
      .catch((caught) => active && setError(caught.message || "Không thể tải cuộc trò chuyện"))
      .finally(() => active && setLoadingMessages(false))
    return () => { active = false }
  }, [selectedConvId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, selectedConvId])

  const sendMessage = async (event) => {
    event.preventDefault()
    const content = inputText.trim()
    if (!content || !selectedConvId || sending) return

    setSending(true)
    setError("")
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConvId, content }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể gửi tin nhắn")
      setMessages((items) => [...items, data])
      setInputText("")
      setConversations((items) =>
        items.map((item) =>
          item.id === selectedConvId
            ? {
                ...item,
                lastMessage: {
                  content: data.content,
                  senderName: currentUser.displayName || currentUser.username,
                  createdAt: data.createdAt,
                },
                updatedAt: data.createdAt,
              }
            : item
        )
      )
    } catch (caught) {
      setError(caught.message || "Không thể gửi tin nhắn")
    } finally {
      setSending(false)
    }
  }

  const selectConversation = (conversationId) => {
    setMessages([])
    setLoadingMessages(true)
    setSelectedConvId(conversationId)
  }

  const renderConversation = (conversation) => {
    const other = conversation.otherUser || {}
    const name = other.displayName || other.username || "Người dùng"
    const active = conversation.id === selectedConvId
    return (
      <button
        key={conversation.id}
        type="button"
        onClick={() => selectConversation(conversation.id)}
        className={`flex w-full items-center gap-3 border-b border-border/45 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/60 ${active ? "bg-primary/10" : ""}`}
      >
        <Avatar className="h-11 w-11 shrink-0 ring-1 ring-primary/20">
          {other.avatarUrl && <AvatarImage src={other.avatarUrl} alt={name} className="object-cover" />}
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold">{name}</span>
            {conversation.unread > 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {conversation.lastMessage?.content || "Chưa có tin nhắn"}
          </p>
        </div>
        {conversation.lastMessage?.createdAt && (
          <span className="shrink-0 text-[10px] text-muted-foreground">{formatTimeAgo(conversation.lastMessage.createdAt)}</span>
        )}
      </button>
    )
  }

  return (
    <main id="main-content" className="h-[100dvh] w-full overflow-hidden bg-background">
      <Header />

      <div className="grid h-full w-full grid-cols-1 gap-5 overflow-hidden px-3 pb-[76px] pt-[76px] sm:px-5 md:pb-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,900px)_minmax(320px,1fr)] xl:grid-cols-[280px_minmax(24px,1fr)_minmax(0,900px)_minmax(24px,1fr)_320px] xl:gap-6 min-[2100px]:mx-auto min-[2100px]:max-w-[1580px]">
        <div className="hidden min-w-0 xl:col-start-1 xl:block"><LeftSidebar /></div>

        <section className="min-h-0 min-w-0 lg:col-start-2 xl:col-start-3">
          <div className="social-card grid h-full min-h-0 overflow-hidden md:grid-cols-[320px_minmax(0,1fr)]">
            <aside className={`${selectedConvId ? "hidden md:flex" : "flex"} min-h-0 flex-col border-border/60 md:border-r`}>
              <div className="border-b border-border/60 px-4 py-4">
                <h1 className="text-xl font-bold">Tin nhắn</h1>
                <p className="mt-1 text-xs text-muted-foreground">Trao đổi riêng với các cần thủ.</p>
              </div>
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <div className="flex h-48 items-center justify-center text-primary">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex h-56 flex-col items-center justify-center px-6 text-center text-muted-foreground">
                    <MessageCircle className="h-10 w-10 text-primary/50" />
                    <p className="mt-3 text-sm font-semibold text-foreground">Chưa có cuộc trò chuyện nào</p>
                    <p className="mt-1 text-xs">Vào hồ sơ người dùng khác để bắt đầu nhắn tin.</p>
                  </div>
                ) : (
                  conversations.map(renderConversation)
                )}
              </div>
            </aside>

            <section className={`${selectedConvId ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
              {selectedConv ? (
                <>
                  <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
                    <button type="button" onClick={() => { setSelectedConvId(null); setMessages([]) }} className="kinetic flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted md:hidden" aria-label="Quay lại danh sách">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <Avatar className="h-10 w-10">
                      {selectedConv.otherUser?.avatarUrl && <AvatarImage src={selectedConv.otherUser.avatarUrl} alt={selectedConv.otherUser.displayName || selectedConv.otherUser.username} className="object-cover" />}
                      <AvatarFallback className="bg-secondary text-xs font-bold">{(selectedConv.otherUser?.displayName || selectedConv.otherUser?.username || "ND").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-bold">{selectedConv.otherUser?.displayName || selectedConv.otherUser?.username}</h2>
                      <p className="truncate text-xs text-muted-foreground">@{selectedConv.otherUser?.username}</p>
                    </div>
                  </div>

                  <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 px-4 py-4">
                    {loadingMessages ? (
                      <div className="flex h-full items-center justify-center text-primary">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                        Bắt đầu cuộc trò chuyện.
                      </div>
                    ) : (
                      messages.map((message) => {
                        const mine = message.sender?.id === currentUser.id
                        return (
                          <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card text-foreground ring-1 ring-border/60"}`}>
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              <div className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "justify-end text-primary-foreground/70" : "text-muted-foreground"}`}>
                                <span>{formatTimeAgo(message.createdAt)}</span>
                                {mine && message.isRead && <CheckCheck className="h-3 w-3" />}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {error && <p role="alert" className="border-t border-border/60 bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</p>}

                  <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border/60 bg-card px-3 py-3">
                    <input
                      value={inputText}
                      onChange={(event) => setInputText(event.target.value)}
                      disabled={sending}
                      maxLength={2000}
                      placeholder="Nhập tin nhắn..."
                      className="h-11 min-w-0 flex-1 rounded-full bg-muted px-4 text-sm outline-none ring-1 ring-border/50 focus:bg-background focus:ring-primary/45"
                    />
                    <button type="submit" disabled={!inputText.trim() || sending} className="kinetic flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-45" aria-label="Gửi tin nhắn">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </form>
                </>
              ) : (
                <div className="hidden h-full flex-col items-center justify-center text-center text-muted-foreground md:flex">
                  <MessageCircle className="h-12 w-12 text-primary/50" />
                  <p className="mt-4 text-sm font-semibold text-foreground">Chọn một cuộc trò chuyện</p>
                  <p className="mt-1 text-xs">Tin nhắn sẽ hiển thị tại đây.</p>
                </div>
              )}
            </section>
          </div>
        </section>

        <div className="hidden min-w-0 justify-self-end lg:col-start-3 lg:block xl:col-start-5"><RightSidebar /></div>
      </div>
    </main>
  )
}
