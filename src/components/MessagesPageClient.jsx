"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Camera, CameraOff, CheckCheck, ImagePlus, Info, Loader2, MessageCircle, Mic, MicOff, Minus, MoreHorizontal, Pause, Phone, PhoneOff, Play, RotateCcw, Search, Send, Smile, Sticker, ThumbsUp, Video, X, ZoomIn } from "lucide-react"
import { Header } from "@/components/Header"
import { LeftSidebar } from "@/components/LeftSidebar"
import { RightSidebar } from "@/components/RightSidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSearchParams } from "next/navigation"

const MESSAGE_MEDIA_PREFIX = "FISHVIET_MEDIA:"
const emojiCategories = [
  {
    id: "smileys",
    label: "Smileys",
    icon: "☺️",
    items: [
      "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎",
      "😍", "😘", "🥰", "😗", "😙", "😚", "🙂", "🤗", "🤩", "🤔", "🫡", "🤨",
      "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫",
      "🥱", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃",
      "🫠", "🤑", "😲", "☹️", "🙁", "😖", "😞", "😟", "😤", "😢", "😭", "😦",
      "😧", "😨", "😩", "🤯", "😬", "😰", "😱", "🥵", "🥶", "😳", "🤪", "😵",
      "🥴", "😠", "😡", "🤬", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇", "🥳",
    ],
  },
  {
    id: "animals",
    label: "Animals",
    icon: "🐱",
    items: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁",
      "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤",
      "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋",
      "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🦂", "🐢", "🐍",
      "🦎", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🦈",
    ],
  },
  {
    id: "food",
    label: "Food",
    icon: "🍴",
    items: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒",
      "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑",
      "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨",
      "🧀", "🥚", "🍳", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟",
      "🍕", "🥪", "🥙", "🧆", "🌮", "🌯", "🥗", "🍜", "🍲", "🍣", "🍤", "🍚",
    ],
  },
  {
    id: "activities",
    label: "Activities",
    icon: "⚽",
    items: [
      "🎣", "🪝", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🥎", "🎾",
      "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃",
      "🥅", "⛳", "🪁", "🏹", "🎯", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️",
      "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️", "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄",
      "🏊", "🤽", "🚣", "🧗", "🚴", "🚵", "🎮", "🎲", "🎸", "🎤", "🎧", "🎬",
    ],
  },
  {
    id: "travel",
    label: "Travel",
    icon: "🚗",
    items: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚",
      "🚛", "🚜", "🛵", "🏍️", "🛺", "🚲", "🛴", "🚏", "🛣️", "🛤️", "⛽", "🚨",
      "🚥", "🚦", "🛑", "🚧", "⚓", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "✈️",
      "🛩️", "🛫", "🛬", "🪂", "💺", "🚁", "🚟", "🚠", "🚡", "🛰️", "🚀", "🛸",
      "🏕️", "🏖️", "🏝️", "🏞️", "🌋", "🗻", "🏔️", "⛰️", "🌅", "🌄", "🌠", "🌌",
    ],
  },
  {
    id: "objects",
    label: "Objects",
    icon: "💡",
    items: [
      "⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🕹️", "🗜️", "💽", "💾", "💿",
      "📀", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺",
      "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡",
      "🔋", "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💰", "💳",
      "🧰", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🔩", "⚙️", "🧲", "🧪", "🧫", "🧬",
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    icon: "🔣",
    items: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕",
      "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️",
      "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌",
      "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️",
      "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️",
    ],
  },
  {
    id: "flags",
    label: "Flags",
    icon: "🏳️",
    items: [
      "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇻🇳", "🇺🇸", "🇯🇵", "🇰🇷",
      "🇨🇳", "🇹🇭", "🇸🇬", "🇲🇾", "🇵🇭", "🇮🇩", "🇱🇦", "🇰🇭", "🇲🇲", "🇫🇷", "🇩🇪", "🇬🇧",
      "🇮🇹", "🇪🇸", "🇵🇹", "🇳🇱", "🇧🇪", "🇨🇭", "🇦🇺", "🇳🇿", "🇨🇦", "🇧🇷", "🇦🇷", "🇲🇽",
    ],
  },
]
const stickerItems = [
  "🎣", "🐟", "🐠", "🐡", "🦈", "🦐", "🦑", "🌊",
  "🚤", "🪝", "🏆", "🥇", "🔥", "✨", "🎉", "💪",
  "😄", "😎", "🤝", "❤️", "💙", "☀️", "🌧️", "⚡",
]
const gifItems = ["GIF 🎣 Strike!", "GIF 🐟 Big catch!", "GIF 🔥 Nice!", "GIF 👏 Congrats!"]

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

function encodeMediaMessage(kind, url, label = "") {
  return `${MESSAGE_MEDIA_PREFIX}${JSON.stringify({ kind, url, label })}`
}

function decodeMediaMessage(content) {
  if (!String(content || "").startsWith(MESSAGE_MEDIA_PREFIX)) return null
  try {
    const payload = JSON.parse(String(content).slice(MESSAGE_MEDIA_PREFIX.length))
    if (!payload?.kind) return null
    return payload
  } catch {
    return null
  }
}

function previewMessage(content) {
  const media = decodeMediaMessage(content)
  if (!media) return content
  if (media.kind === "image") return "Đã gửi một ảnh"
  if (media.kind === "audio") return "Đã gửi một voice"
  if (media.kind === "sticker") return "Đã gửi một sticker"
  if (media.kind === "gif") return media.label || "Đã gửi một GIF"
  return "Đã gửi một tệp"
}

function formatVoiceTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0")
  return `${minutes}:${rest}`
}

function supportedAudioMimeType() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return ""
  return [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ].find((type) => MediaRecorder.isTypeSupported(type)) || ""
}

function extensionForAudioMime(mimeType) {
  return String(mimeType || "").startsWith("audio/mp4") ? "m4a" : "weba"
}

function stopMediaStream(stream) {
  stream?.getTracks?.().forEach((track) => track.stop())
}

function VoiceMessagePlayer({ src, mine }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const waveBars = [16, 28, 20, 34, 18, 26, 38, 22, 30, 16, 36, 24, 18, 32, 40, 20, 28, 34]

  useEffect(() => () => {
    audioRef.current?.pause()
  }, [])

  const progress = duration > 0 ? Math.min(100, Math.max(0, currentTime / duration * 100)) : 0

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    try {
      await audio.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  const seek = (event) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const next = Number(event.target.value)
    audio.currentTime = next
    setCurrentTime(next)
  }

  return (
    <div className={`w-[min(58vw,220px)] rounded-[1.25rem] px-2 py-2 shadow-sm ${mine ? "bg-primary/95 text-primary-foreground" : "bg-muted text-foreground"}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setCurrentTime(0)
        }}
        className="hidden"
      />
      <div className="flex items-center gap-2">
        <button type="button" onClick={togglePlay} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${mine ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`} aria-label={playing ? "Tạm dừng voice" : "Phát voice"}>
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="relative h-8">
            <div className="absolute inset-0 flex items-center gap-1">
              {waveBars.map((height, index) => {
                const active = index / Math.max(1, waveBars.length - 1) * 100 <= progress
                return (
                  <span
                    key={`${height}-${index}`}
                    className={`w-1 flex-1 rounded-full transition-colors ${active ? mine ? "bg-white" : "bg-primary" : mine ? "bg-white/35" : "bg-muted-foreground/25"}`}
                    style={{ height: `${height}%` }}
                  />
                )
              })}
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.01"
              value={Math.min(currentTime, duration || 0)}
              onChange={seek}
              aria-label="Tua voice"
              className="absolute inset-0 h-8 w-full cursor-pointer opacity-0"
            />
          </div>
          <div className={`mt-1 flex items-center justify-between text-[11px] font-semibold tabular-nums ${mine ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
            <span>{formatVoiceTime(currentTime)}</span>
            <span>{formatVoiceTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MessagesPageClient({ currentUser }) {
  const searchParams = useSearchParams()
  const requestedUsername = searchParams.get("to")
  const [conversations, setConversations] = useState([])
  const [selectedConvId, setSelectedConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [conversationQuery, setConversationQuery] = useState("")
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [handoffPulse, setHandoffPulse] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [activePicker, setActivePicker] = useState(null)
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(emojiCategories[0].id)
  const [imageViewer, setImageViewer] = useState(null)
  const [imageZoom, setImageZoom] = useState(1)
  const [callState, setCallState] = useState(null)
  const [callStarting, setCallStarting] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  const [callMicEnabled, setCallMicEnabled] = useState(true)
  const [callCameraEnabled, setCallCameraEnabled] = useState(true)
  const [callError, setCallError] = useState("")
  const [incomingCall, setIncomingCall] = useState(null)
  const [incomingActionLoading, setIncomingActionLoading] = useState(false)
  const [remoteStream, setRemoteStream] = useState(null)
  const messagesEndRef = useRef(null)
  const imageInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const callVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const callStreamRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const handledSignalIdsRef = useRef(new Set())
  const audioChunksRef = useRef([])
  const requestedConversationHandledRef = useRef(false)

  const selectedConv = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConvId) || null,
    [conversations, selectedConvId]
  )
  const activeCallId = callState?.callId || ""
  const filteredEmojiItems = useMemo(
    () => emojiCategories.find((category) => category.id === activeEmojiCategory)?.items || emojiCategories[0].items,
    [activeEmojiCategory]
  )
  const filteredConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase()
    if (!query) return conversations
    return conversations.filter((conversation) => {
      const other = conversation.otherUser || {}
      return [other.displayName, other.username, previewMessage(conversation.lastMessage?.content)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    })
  }, [conversationQuery, conversations])

  useEffect(() => {
    let active = true
    const query = requestedUsername ? `?with=${encodeURIComponent(requestedUsername)}` : ""
    fetch(`/api/messages${query}`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Không thể tải tin nhắn")
        return data
      })
      .then((data) => {
        if (!active) return
        const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []
        const requestedId = data?.selectedConversationId || null
        setConversations(items)
        if (requestedId) {
          setLoadingMessages(true)
          requestedConversationHandledRef.current = true
          setHandoffPulse(true)
          setTimeout(() => setHandoffPulse(false), 900)
          setSelectedConvId(requestedId)
        } else if (items?.[0]?.id && !requestedUsername && !requestedConversationHandledRef.current) {
          setLoadingMessages(true)
          setSelectedConvId((current) => current || items[0].id)
        }
      })
      .catch((caught) => active && setError(caught.message || "Không thể tải tin nhắn"))
      .finally(() => active && setLoadingConversations(false))
    return () => { active = false }
  }, [requestedUsername])

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

  useEffect(() => () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
  }, [])

  useEffect(() => {
    if (!recording) {
      return undefined
    }
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      setRecordingSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)))
    }, 250)
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    if (!callState?.stream) return undefined
    if (callVideoRef.current) callVideoRef.current.srcObject = callState.stream
    const timer = window.setInterval(() => setCallSeconds((seconds) => seconds + 1), 1000)
    return () => window.clearInterval(timer)
  }, [callState])

  useEffect(() => {
    if (callVideoRef.current && callState?.stream) callVideoRef.current.srcObject = callState.stream
  }, [callState?.stream, remoteStream])

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => () => {
    peerConnectionRef.current?.close()
    stopMediaStream(callStreamRef.current)
  }, [])

  useEffect(() => {
    if (!selectedConvId || callState) return undefined
    let active = true
    const loadIncomingCall = async () => {
      try {
        const response = await fetch(`/api/messages/calls?conversationId=${encodeURIComponent(selectedConvId)}`)
        const data = await response.json()
        if (!active || !response.ok) return
        const nextIncoming = (data.items || []).find((item) => item.callerId !== currentUser.id && item.status === "ringing")
        setIncomingCall(nextIncoming || null)
      } catch {
        if (active) setIncomingCall(null)
      }
    }
    loadIncomingCall()
    const timer = window.setInterval(loadIncomingCall, 1500)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [callState, currentUser.id, selectedConvId])

  useEffect(() => {
    if (!imageViewer) return undefined

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setImageViewer(null)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [imageViewer])

  const openImageViewer = (media) => {
    setImageViewer(media)
    setImageZoom(1)
  }

  const zoomOutImage = () => setImageZoom((zoom) => Math.max(0.5, Number((zoom - 0.25).toFixed(2))))
  const zoomInImage = () => setImageZoom((zoom) => Math.min(3, Number((zoom + 0.25).toFixed(2))))
  const handleImageWheel = (event) => {
    event.preventDefault()
    const direction = event.deltaY > 0 ? -1 : 1
    setImageZoom((zoom) => Math.min(4, Math.max(0.5, Number((zoom + direction * 0.15).toFixed(2)))))
  }

  const sendTextMessage = async (content, { force = false } = {}) => {
    if (!content || !selectedConvId || (sending && !force)) return

    setSending(true)
    setActivePicker(null)
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

  const sendMessage = async (event) => {
    event.preventDefault()
    await sendTextMessage(inputText.trim())
  }

  const sendQuickLike = () => sendTextMessage("👍")

  const uploadMessageFile = async (file) => {
    const form = new FormData()
    form.set("file", file)
    form.set("purpose", "message")
    const response = await fetch("/api/uploads", { method: "POST", body: form })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Không thể tải tệp lên")
    return data
  }

  const sendImageFile = async (file) => {
    if (!file || sending) return
    if (!file.type.startsWith("image/")) {
      setError("Chỉ hỗ trợ gửi ảnh trong nút này.")
      return
    }
    setSending(true)
    setError("")
    try {
      const uploaded = await uploadMessageFile(file)
      await sendTextMessage(encodeMediaMessage("image", uploaded.url, file.name || "image"), { force: true })
    } catch (caught) {
      setError(caught.message || "Không thể gửi ảnh")
      setSending(false)
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = ""
    }
  }

  const postCallSignal = useCallback(async (callId, type, payload) => {
    const response = await fetch(`/api/messages/calls/${callId}/signals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || "Không thể gửi tín hiệu cuộc gọi")
    }
  }, [])

  const cleanupCallConnection = useCallback(() => {
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null
    stopMediaStream(callStreamRef.current)
    callStreamRef.current = null
    if (callVideoRef.current) callVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null
    setRemoteStream(null)
    handledSignalIdsRef.current = new Set()
  }, [])

  const createPeerConnection = (callId, stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })
    stream.getTracks().forEach((track) => peer.addTrack(track, stream))
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        postCallSignal(callId, "candidate", event.candidate.toJSON()).catch(() => {
          setCallError("Không thể gửi kết nối mạng của cuộc gọi.")
        })
      }
    }
    peer.ontrack = (event) => {
      setRemoteStream(event.streams?.[0] || new MediaStream([event.track]))
    }
    peer.onconnectionstatechange = () => {
      if (["failed", "disconnected"].includes(peer.connectionState)) {
        setCallError("Kết nối cuộc gọi không ổn định. Hãy thử gọi lại.")
      }
    }
    peerConnectionRef.current = peer
    return peer
  }

  const requestCallMedia = useCallback((mode) => navigator.mediaDevices.getUserMedia({
    audio: true,
    video: mode === "video" ? { facingMode: "user" } : false,
  }), [])

  const startCall = async (mode) => {
    if (callStarting) return
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setCallError("Mobile chỉ cho phép dùng camera/micro trên HTTPS. Hãy mở web bằng HTTPS hoặc localhost.")
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
      setCallError("Trình duyệt không hỗ trợ gọi thoại/video.")
      return
    }
    if (!selectedConvId) return
    setCallError("")
    setCallStarting(true)
    let stream
    try {
      stream = await requestCallMedia(mode)
      const response = await fetch("/api/messages/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConvId, mode }),
      })
      const session = await response.json()
      if (!response.ok) throw new Error(session.error || "Không thể bắt đầu cuộc gọi")

      cleanupCallConnection()
      callStreamRef.current = stream
      setCallSeconds(0)
      setCallMicEnabled(true)
      setCallCameraEnabled(mode === "video")
      setIncomingCall(null)
      setCallState({ mode, stream, callId: session.id, isCaller: true, status: session.status, caller: session.caller })

      const peer = createPeerConnection(session.id, stream)
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      await postCallSignal(session.id, "offer", offer)
    } catch (caught) {
      stopMediaStream(stream)
      cleanupCallConnection()
      const denied = caught?.name === "NotAllowedError" || caught?.name === "PermissionDeniedError"
      setCallError(denied ? "Bạn cần cấp quyền camera/micro trong trình duyệt để dùng cuộc gọi." : caught.message || (mode === "video" ? "Không thể truy cập camera/micro." : "Không thể truy cập micro."))
    } finally {
      setCallStarting(false)
    }
  }

  const finishCall = useCallback(() => {
    cleanupCallConnection()
    setCallState(null)
    setCallSeconds(0)
    setCallMicEnabled(true)
    setCallCameraEnabled(true)
  }, [cleanupCallConnection])

  const endCall = useCallback(async ({ notify = true } = {}) => {
    const callId = activeCallId
    if (notify && callId) {
      fetch(`/api/messages/calls/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      }).catch(() => {})
    }
    finishCall()
    setCallError("")
  }, [activeCallId, finishCall])

  const toggleCallMic = () => {
    callState?.stream?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled
      setCallMicEnabled(track.enabled)
    })
  }

  const toggleCallCamera = () => {
    callState?.stream?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled
      setCallCameraEnabled(track.enabled)
    })
  }

  const acceptIncomingCall = async () => {
    if (!incomingCall || incomingActionLoading) return
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setCallError("Mobile chỉ cho phép dùng camera/micro trên HTTPS. Hãy mở web bằng HTTPS hoặc localhost.")
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
      setCallError("Trình duyệt không hỗ trợ gọi thoại/video.")
      return
    }
    setIncomingActionLoading(true)
    let stream
    try {
      stream = await requestCallMedia(incomingCall.mode)
      const response = await fetch(`/api/messages/calls/${incomingCall.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      })
      const session = await response.json()
      if (!response.ok) throw new Error(session.error || "Không thể nhận cuộc gọi")

      cleanupCallConnection()
      callStreamRef.current = stream
      setCallSeconds(0)
      setCallMicEnabled(true)
      setCallCameraEnabled(incomingCall.mode === "video")
      setCallState({ mode: incomingCall.mode, stream, callId: incomingCall.id, isCaller: false, status: "active", caller: incomingCall.caller })
      createPeerConnection(incomingCall.id, stream)
      setIncomingCall(null)
      setCallError("")
    } catch (caught) {
      stopMediaStream(stream)
      cleanupCallConnection()
      const denied = caught?.name === "NotAllowedError" || caught?.name === "PermissionDeniedError"
      setCallError(denied ? "Bạn cần cấp quyền camera/micro trong trình duyệt để nhận cuộc gọi." : caught.message || "Không thể nhận cuộc gọi.")
    } finally {
      setIncomingActionLoading(false)
    }
  }

  const declineIncomingCall = async () => {
    if (!incomingCall || incomingActionLoading) return
    setIncomingActionLoading(true)
    try {
      await fetch(`/api/messages/calls/${incomingCall.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      })
      setIncomingCall(null)
    } finally {
      setIncomingActionLoading(false)
    }
  }

  const handleRemoteSignal = useCallback(async (signal) => {
    if (!activeCallId || handledSignalIdsRef.current.has(signal.id)) return
    handledSignalIdsRef.current.add(signal.id)

    if (signal.type === "declined" || signal.type === "ended") {
      await endCall({ notify: false })
      setCallError(signal.type === "declined" ? "Cuộc gọi đã bị từ chối." : "")
      return
    }
    if (signal.type === "accepted") {
      setCallState((current) => current ? { ...current, status: "active" } : current)
      return
    }

    const peer = peerConnectionRef.current
    if (!peer) return
    if (signal.type === "offer") {
      if (peer.currentRemoteDescription) return
      await peer.setRemoteDescription(new RTCSessionDescription(signal.payload))
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      await postCallSignal(activeCallId, "answer", answer)
      setCallState((current) => current ? { ...current, status: "active" } : current)
      return
    }
    if (signal.type === "answer") {
      if (peer.currentRemoteDescription) return
      await peer.setRemoteDescription(new RTCSessionDescription(signal.payload))
      setCallState((current) => current ? { ...current, status: "active" } : current)
      return
    }
    if (signal.type === "candidate") {
      await peer.addIceCandidate(new RTCIceCandidate(signal.payload))
    }
  }, [activeCallId, endCall, postCallSignal])

  useEffect(() => {
    if (!activeCallId) return undefined
    let active = true
    const loadSignals = async () => {
      try {
        const response = await fetch(`/api/messages/calls/${activeCallId}/signals`)
        const data = await response.json()
        if (!active || !response.ok) return
        for (const signal of data.items || []) {
          await handleRemoteSignal(signal)
        }
      } catch {
        if (active) setCallError("Không thể đồng bộ tín hiệu cuộc gọi.")
      }
    }
    loadSignals()
    const timer = window.setInterval(loadSignals, 1000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [activeCallId, handleRemoteSignal])

  const startRecording = async () => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Mobile chỉ cho phép dùng micro trên HTTPS. Hãy mở web bằng HTTPS hoặc localhost.")
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Trình duyệt không hỗ trợ ghi âm.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = supportedAudioMimeType()
      let recorder
      try {
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      } catch (caught) {
        stream.getTracks().forEach((track) => track.stop())
        throw caught
      }
      audioChunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        setRecording(false)
        setRecordingSeconds(0)
        const recordedType = recorder.mimeType || mimeType || "audio/webm"
        const blob = new Blob(audioChunksRef.current, { type: recordedType })
        if (blob.size < 1) return
        try {
          setSending(true)
          const file = new File([blob], `voice-${Date.now()}.${extensionForAudioMime(recordedType)}`, { type: recordedType })
          const uploaded = await uploadMessageFile(file)
          await sendTextMessage(encodeMediaMessage("audio", uploaded.url, "Voice"), { force: true })
        } catch (caught) {
          setError(caught.message || "Không thể gửi voice")
          setSending(false)
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecordingSeconds(0)
      setRecording(true)
      setError("")
    } catch {
      setError("Không thể truy cập micro.")
    }
  }

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      return
    }
    await startRecording()
  }

  const sendSticker = (sticker) => sendTextMessage(encodeMediaMessage("sticker", "", sticker))
  const sendGif = (label) => sendTextMessage(encodeMediaMessage("gif", "", label))

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
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-300 hover:bg-muted/60 ${active ? "bg-primary/12" : ""} ${handoffPulse && active ? "shadow-[inset_3px_0_0_hsl(var(--primary))]" : ""}`}
      >
        <Avatar className="h-12 w-12 shrink-0 ring-1 ring-primary/20">
          {other.avatarUrl && <AvatarImage src={other.avatarUrl} alt={name} className="object-cover" />}
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-bold">{name}</span>
            {conversation.lastMessage?.createdAt && (
              <span className="shrink-0 text-[10px] text-muted-foreground">{formatTimeAgo(conversation.lastMessage.createdAt)}</span>
            )}
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <p className="truncate text-xs text-muted-foreground">
              {conversation.lastMessage?.content ? previewMessage(conversation.lastMessage.content) : "Chưa có tin nhắn"}
            </p>
            {conversation.unread > 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </div>
        </div>
      </button>
    )
  }

  return (
    <main id="main-content" className="h-[100dvh] w-full overflow-hidden bg-background">
      <Header hideMobileNav={Boolean(selectedConvId)} />

      <div className="mt-16 grid h-[calc(100dvh-4rem)] w-full grid-cols-1 gap-0 overflow-hidden px-0 pb-0 md:mt-[76px] md:h-[calc(100dvh-76px)] md:gap-5 md:px-5 md:pb-3 lg:grid-cols-[minmax(24px,1fr)_minmax(0,1100px)_minmax(24px,1fr)] xl:grid-cols-[280px_minmax(24px,1fr)_minmax(0,1100px)_minmax(24px,1fr)_320px] xl:gap-6 min-[2100px]:mx-auto min-[2100px]:max-w-[1780px]">
        <div className="hidden min-w-0 xl:col-start-1 xl:block"><LeftSidebar /></div>

        <section className="min-h-0 min-w-0 lg:col-start-2 xl:col-start-3">
          <div className={`grid h-full min-h-0 overflow-hidden border-border/70 bg-card/90 shadow-sm transition-shadow duration-500 md:rounded-3xl md:border md:grid-cols-[340px_minmax(0,1fr)] ${handoffPulse ? "shadow-[0_0_0_2px_hsl(var(--primary)/0.45),0_0_45px_hsl(var(--primary)/0.28)]" : ""}`}>
            <aside className={`${selectedConvId ? "hidden md:flex" : "flex"} min-h-0 flex-col border-border/60 md:border-r`}>
              <div className="border-b border-border/60 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-black tracking-[-0.04em]">Tin nhắn</h1>
                    <p className="mt-1 text-xs text-muted-foreground">Trao đổi riêng với các cần thủ.</p>
                  </div>
                  <button type="button" className="kinetic flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary hover:bg-primary/10" aria-label="Tùy chọn tin nhắn">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
                <label className="mt-4 flex h-10 items-center gap-2 rounded-full bg-muted/80 px-3 text-muted-foreground ring-1 ring-border/45 focus-within:bg-background focus-within:ring-primary/35">
                  <Search className="h-4 w-4 shrink-0" />
                  <input
                    value={conversationQuery}
                    onChange={(event) => setConversationQuery(event.target.value)}
                    placeholder="Tìm trên Messenger"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </label>
              </div>
              <div className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
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
                ) : filteredConversations.length === 0 ? (
                  <div className="flex h-40 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                    Không tìm thấy cuộc trò chuyện phù hợp.
                  </div>
                ) : (
                  filteredConversations.map(renderConversation)
                )}
              </div>
            </aside>

            <section className={`${selectedConvId ? "flex" : "hidden md:flex"} min-h-0 flex-col bg-background/35`}>
              {selectedConv ? (
                <>
                  <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-card/95 px-3 md:px-4">
                    <button type="button" onClick={() => { setSelectedConvId(null); setMessages([]) }} className="kinetic flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10 md:hidden" aria-label="Quay lại danh sách">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <Avatar className="h-11 w-11">
                      {selectedConv.otherUser?.avatarUrl && <AvatarImage src={selectedConv.otherUser.avatarUrl} alt={selectedConv.otherUser.displayName || selectedConv.otherUser.username} className="object-cover" />}
                      <AvatarFallback className="bg-secondary text-xs font-bold">{(selectedConv.otherUser?.displayName || selectedConv.otherUser?.username || "ND").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold">{selectedConv.otherUser?.displayName || selectedConv.otherUser?.username}</h2>
                      <p className="truncate text-xs text-primary">Đang hoạt động</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-primary">
                      <button type="button" onClick={() => startCall("audio")} disabled={callStarting} className="kinetic flex h-9 w-9 items-center justify-center rounded-full hover:bg-primary/10 disabled:opacity-45" aria-label="Gọi thoại">
                        {callStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                      </button>
                      <button type="button" onClick={() => startCall("video")} disabled={callStarting} className="kinetic flex h-9 w-9 items-center justify-center rounded-full hover:bg-primary/10 disabled:opacity-45" aria-label="Gọi video">
                        <Video className="h-4 w-4" />
                      </button>
                      <button type="button" className="kinetic hidden h-9 w-9 items-center justify-center rounded-full hover:bg-primary/10 sm:flex" aria-label="Thông tin hội thoại">
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="custom-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-background/35 px-2 py-3 sm:px-4">
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
                        const media = decodeMediaMessage(message.content)
                        const otherName = selectedConv.otherUser?.displayName || selectedConv.otherUser?.username || "ND"
                        return (
                          <div key={message.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                            {!mine && (
                              <Avatar className="h-7 w-7 shrink-0">
                                {selectedConv.otherUser?.avatarUrl && <AvatarImage src={selectedConv.otherUser.avatarUrl} alt={otherName} className="object-cover" />}
                                <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">{otherName.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`${media?.kind === "image" ? "max-w-[min(76vw,320px)] p-1" : media?.kind === "audio" ? "max-w-[min(76vw,260px)] p-1" : media?.kind === "sticker" ? "max-w-[68vw] px-2 py-1.5" : "max-w-[min(72vw,420px)] px-3 py-2"} rounded-[1.35rem] text-sm leading-5 shadow-sm md:max-w-[62%] ${mine ? "rounded-br-md bg-[#2597ff] text-white" : "rounded-bl-md bg-muted text-foreground"}`}>
                              {media?.kind === "image" ? (
                                <button type="button" onClick={() => openImageViewer(media)} className="group block overflow-hidden rounded-[1.1rem] bg-background/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                  <img src={media.url} alt={media.label || "Ảnh trong tin nhắn"} className="max-h-64 w-full rounded-[1.1rem] object-contain transition duration-200 group-hover:scale-[1.015]" />
                                </button>
                              ) : media?.kind === "audio" ? (
                                <VoiceMessagePlayer src={media.url} mine={mine} />
                              ) : media?.kind === "sticker" ? (
                                <p className="text-4xl leading-none">{media.label}</p>
                              ) : media?.kind === "gif" ? (
                                <p className={`rounded-xl px-3 py-2 text-sm font-bold ${mine ? "bg-white/15 text-white" : "bg-primary/10 text-primary"}`}>{media.label}</p>
                              ) : (
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              )}
                              <div className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "justify-end text-white/70" : "text-muted-foreground"}`}>
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

                  {(error || callError) && <p role="alert" className="border-t border-border/60 bg-destructive/10 px-4 py-2 text-xs text-destructive">{callError || error}</p>}

                  <form onSubmit={sendMessage} className="relative flex shrink-0 items-center gap-1.5 border-t border-border/60 bg-card/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:gap-2 sm:px-3">
                    {activePicker && (
                      <div className="absolute bottom-full left-2 right-2 mb-2 flex max-h-[320px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-popover text-sm shadow-2xl sm:left-3 sm:right-auto sm:w-fit sm:max-w-[calc(100vw-2rem)]">
                        {activePicker === "emoji" && (
                          <>
                            <div className="custom-scrollbar flex w-max max-w-full shrink-0 items-center gap-1 overflow-x-auto border-b border-border/60 bg-muted/40 px-2 py-1.5">
                              {emojiCategories.map((category) => (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() => setActiveEmojiCategory(category.id)}
                                  aria-label={category.label}
                                  title={category.label}
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base transition ${activeEmojiCategory === category.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                                >
                                  {category.icon}
                                </button>
                              ))}
                            </div>
                            <div className="custom-scrollbar grid min-h-0 w-max max-w-full grid-cols-8 gap-1 overflow-y-auto p-2 max-[420px]:grid-cols-7">
                              {filteredEmojiItems.map((item) => (
                                <button key={item} type="button" onClick={() => setInputText((text) => `${text}${item}`)} className="flex h-9 w-9 items-center justify-center rounded-xl text-lg hover:bg-muted">
                                  {item}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                        {activePicker === "sticker" && (
                          <div className="custom-scrollbar grid max-h-64 grid-cols-6 gap-1 overflow-y-auto p-2">
                            {stickerItems.map((item) => (
                              <button key={item} type="button" onClick={() => sendSticker(item)} className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl hover:bg-muted">
                                {item}
                              </button>
                            ))}
                          </div>
                        )}
                        {activePicker === "gif" && (
                          <div className="grid gap-1 p-2">
                            {gifItems.map((item) => (
                              <button key={item} type="button" onClick={() => sendGif(item)} className="rounded-xl bg-muted/70 px-3 py-2 text-left text-xs font-bold hover:bg-muted">
                                {item}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(event) => sendImageFile(event.target.files?.[0])}
                    />
                    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                      <button type="button" onClick={toggleRecording} aria-label={recording ? "Dừng ghi âm" : "Ghi âm"} className={`kinetic flex h-9 w-9 items-center justify-center rounded-full ${recording ? "bg-destructive/10 text-destructive" : "text-[#2597ff] hover:bg-primary/10"}`}>
                        <Mic className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => imageInputRef.current?.click()} aria-label="Thêm ảnh" className="kinetic flex h-9 w-9 items-center justify-center rounded-full text-[#2597ff] hover:bg-primary/10">
                        <ImagePlus className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setActivePicker((picker) => picker === "sticker" ? null : "sticker")} aria-label="Sticker" className="kinetic hidden h-9 w-9 items-center justify-center rounded-full text-[#2597ff] hover:bg-primary/10 min-[380px]:flex">
                        <Sticker className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setActivePicker((picker) => picker === "gif" ? null : "gif")} aria-label="GIF" className="kinetic hidden h-9 min-w-9 items-center justify-center rounded-full px-2 text-[10px] font-black text-[#2597ff] hover:bg-primary/10 sm:flex">
                        GIF
                      </button>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-muted/90 px-3 ring-1 ring-transparent focus-within:bg-background focus-within:ring-primary/35">
                      {recording ? (
                        <div className="flex h-9 min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-destructive">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                          Đang ghi {formatVoiceTime(recordingSeconds)}
                        </div>
                      ) : (
                        <input
                          value={inputText}
                          onChange={(event) => setInputText(event.target.value)}
                          disabled={sending}
                          maxLength={2000}
                          placeholder="Aa"
                          className="chat-composer-input h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                        />
                      )}
                      <button type="button" onClick={() => setActivePicker((picker) => picker === "emoji" ? null : "emoji")} aria-label="Biểu cảm" className="kinetic flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#2597ff] hover:bg-primary/10">
                        <Smile className="h-4 w-4" />
                      </button>
                    </div>

                    {inputText.trim() ? (
                      <button type="submit" disabled={sending} className="kinetic flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#2597ff] hover:bg-primary/10 disabled:opacity-45" aria-label="Gửi tin nhắn">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    ) : (
                      <button type="button" onClick={sendQuickLike} disabled={sending || !selectedConvId} className="kinetic flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#2597ff] hover:bg-primary/10 disabled:opacity-45" aria-label="Gửi lượt thích">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-5 w-5" />}
                      </button>
                    )}
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

        <div className="hidden min-w-0 justify-self-end xl:col-start-5 xl:block"><RightSidebar /></div>
      </div>

      {incomingCall && !callState && (
        <div className="fixed inset-0 z-[94] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Cuộc gọi đến">
          <section className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-5 text-center shadow-2xl">
            <Avatar className="mx-auto h-20 w-20 ring-4 ring-primary/15">
              {incomingCall.caller?.avatarUrl && <AvatarImage src={incomingCall.caller.avatarUrl} alt={incomingCall.caller.displayName || incomingCall.caller.username} className="object-cover" />}
              <AvatarFallback className="bg-primary text-xl font-black text-primary-foreground">{(incomingCall.caller?.displayName || incomingCall.caller?.username || "ND").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="mt-4 text-lg font-black">{incomingCall.caller?.displayName || incomingCall.caller?.username || "Người dùng"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{incomingCall.mode === "video" ? "Đang gọi video..." : "Đang gọi thoại..."}</p>
            <div className="mt-5 flex items-center justify-center gap-4">
              <button type="button" onClick={declineIncomingCall} disabled={incomingActionLoading} className="kinetic flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 disabled:opacity-50" aria-label="Từ chối cuộc gọi">
                <PhoneOff className="h-6 w-6" />
              </button>
              <button type="button" onClick={acceptIncomingCall} disabled={incomingActionLoading} className="kinetic flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 disabled:opacity-50" aria-label="Nhận cuộc gọi">
                {incomingActionLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : incomingCall.mode === "video" ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
              </button>
            </div>
          </section>
        </div>
      )}

      {callState && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/95 p-3 text-white backdrop-blur-xl sm:p-5" role="dialog" aria-modal="true" aria-label={callState.mode === "video" ? "Gọi video" : "Gọi thoại"}>
          <section className="relative flex h-full max-h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 shadow-2xl">
            {callState.mode === "video" ? (
              <>
                {remoteStream ? (
                  <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <video ref={callVideoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
                )}
                {remoteStream && (
                  <video ref={callVideoRef} autoPlay playsInline muted className="absolute bottom-24 right-4 z-10 h-32 w-24 rounded-2xl border border-white/20 object-cover shadow-2xl sm:bottom-28 sm:right-6 sm:h-44 sm:w-32" />
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_34%,transparent),transparent_42%),linear-gradient(160deg,#061728,#020617)]" />
            )}
            <audio ref={remoteAudioRef} autoPlay className="hidden" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/70" />

            <div className="relative z-10 flex items-center justify-between gap-3 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="truncate text-lg font-black">{selectedConv?.otherUser?.displayName || selectedConv?.otherUser?.username || "Cuộc gọi"}</p>
                <p className="mt-1 text-xs font-semibold text-white/65">{callState.mode === "video" ? "Video call" : "Voice call"} · {callState.status === "ringing" ? "Đang đổ chuông" : remoteStream ? "Đã kết nối" : "Đang kết nối"} · {formatVoiceTime(callSeconds)}</p>
              </div>
              <button type="button" onClick={endCall} className="kinetic flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Đóng cuộc gọi">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center p-5 text-center">
              {callState.mode === "audio" && (
                <Avatar className="h-28 w-28 ring-4 ring-white/15 sm:h-36 sm:w-36">
                  {selectedConv?.otherUser?.avatarUrl && <AvatarImage src={selectedConv.otherUser.avatarUrl} alt={selectedConv.otherUser.displayName || selectedConv.otherUser.username} className="object-cover" />}
                  <AvatarFallback className="bg-primary text-2xl font-black text-primary-foreground">{(selectedConv?.otherUser?.displayName || selectedConv?.otherUser?.username || "ND").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              {callState.mode === "video" && !callCameraEnabled && (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/15 sm:h-36 sm:w-36">
                  <CameraOff className="h-10 w-10 text-white/70" />
                </div>
              )}
              <p className="mt-5 text-sm font-semibold text-white/75">
                {remoteStream ? "Đã kết nối với thiết bị bên kia" : callState.mode === "video" ? "Đang chờ người bên kia tham gia" : "Đang dùng micro của thiết bị"}
              </p>
            </div>

            <div className="relative z-10 flex shrink-0 items-center justify-center gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={toggleCallMic} className={`kinetic flex h-12 w-12 items-center justify-center rounded-full ${callMicEnabled ? "bg-white/15 hover:bg-white/25" : "bg-white text-slate-950"}`} aria-label={callMicEnabled ? "Tắt micro" : "Bật micro"}>
                {callMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
              {callState.mode === "video" && (
                <button type="button" onClick={toggleCallCamera} className={`kinetic flex h-12 w-12 items-center justify-center rounded-full ${callCameraEnabled ? "bg-white/15 hover:bg-white/25" : "bg-white text-slate-950"}`} aria-label={callCameraEnabled ? "Tắt camera" : "Bật camera"}>
                  {callCameraEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                </button>
              )}
              <button type="button" onClick={endCall} className="kinetic flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-xl shadow-red-950/40 hover:bg-red-600" aria-label="Kết thúc cuộc gọi">
                <PhoneOff className="h-6 w-6" />
              </button>
            </div>
          </section>
        </div>
      )}

      {imageViewer && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black/90 text-white">
          <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 sm:px-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{imageViewer.label || "Ảnh trong tin nhắn"}</p>
              <p className="text-xs text-white/60">{Math.round(imageZoom * 100)}%</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={zoomOutImage} className="kinetic flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Thu nhỏ ảnh">
                <Minus className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setImageZoom(1)} className="kinetic flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Đặt lại kích thước ảnh">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button type="button" onClick={zoomInImage} className="kinetic flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Phóng to ảnh">
                <ZoomIn className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setImageViewer(null)} className="kinetic flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Đóng ảnh">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="custom-scrollbar flex min-h-0 flex-1 items-center justify-center overflow-auto p-4" onClick={() => setImageViewer(null)} onWheel={handleImageWheel}>
            <img
              src={imageViewer.url}
              alt={imageViewer.label || "Ảnh trong tin nhắn"}
              className="select-none rounded-xl object-contain shadow-2xl"
              style={{
                maxHeight: imageZoom === 1 ? "100%" : "none",
                maxWidth: imageZoom === 1 ? "100%" : "none",
                width: `${imageZoom * 100}%`,
              }}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      )}
    </main>
  )
}
