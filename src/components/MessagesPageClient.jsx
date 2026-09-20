"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Ban, Bell, BellOff, Camera, CameraOff, CheckCheck, ChevronUp, Copy, ExternalLink, Eye, FileText, Flag, House, ImageIcon, ImagePlus, Info, Loader2, Lock, MessageCircle, Mic, MicOff, Minus, MoreHorizontal, Palette, Pause, Phone, PhoneOff, Pin, Play, Reply, RotateCcw, Search, Send, Shield, Smile, Sticker, UserCircle, Video, X, ZoomIn } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter, useSearchParams } from "next/navigation"

const MESSAGE_MEDIA_PREFIX = "FISHVIET_MEDIA:"
const MESSAGE_REPLY_PREFIX = "FISHVIET_REPLY:"
const MESSAGE_RECALLED = "FISHVIET_RECALLED"
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
const conversationThemes = [
  { id: "river", label: "River", color: "#0ea5e9" },
  { id: "lagoon", label: "Lagoon", color: "#14b8a6" },
  { id: "sunset", label: "Sunset", color: "#f97316" },
  { id: "rose", label: "Rose", color: "#f43f5e" },
  { id: "violet", label: "Violet", color: "#8b5cf6" },
  { id: "slate", label: "Slate", color: "#64748b" },
]
const defaultConversationSettings = {
  themeId: "river",
  quickEmoji: "👍",
  nickname: "",
  muted: false,
  messagePermission: "everyone",
  vanishMode: false,
  readReceipts: true,
  restricted: false,
  blocked: false,
  reportReason: "",
}

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

function formatPresence(user) {
  if (user?.isOnline) return "Đang hoạt động"
  if (user?.lastSeenAt) {
    const timeAgo = formatTimeAgo(user.lastSeenAt)
    return timeAgo ? `Hoạt động ${timeAgo}` : "Không hoạt động"
  }
  return "Không hoạt động"
}

function encodeMediaMessage(kind, url, label = "") {
  return `${MESSAGE_MEDIA_PREFIX}${JSON.stringify({ kind, url, label })}`
}

function encodeReplyMessage(reply, content) {
  if (!reply?.id) return content
  return `${MESSAGE_REPLY_PREFIX}${JSON.stringify({
    replyTo: {
      id: reply.id,
      senderName: reply.senderName || "Người dùng",
      preview: String(reply.preview || "").slice(0, 140),
    },
    content,
  })}`
}

function decodeReplyMessage(content) {
  if (!String(content || "").startsWith(MESSAGE_REPLY_PREFIX)) return null
  try {
    const payload = JSON.parse(String(content).slice(MESSAGE_REPLY_PREFIX.length))
    if (!payload?.content || !payload?.replyTo?.id) return null
    return payload
  } catch {
    return null
  }
}

function unwrapMessageContent(content) {
  return decodeReplyMessage(content)?.content || content
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
  const unwrapped = unwrapMessageContent(content)
  if (unwrapped === MESSAGE_RECALLED) return "Tin nhắn đã được thu hồi"
  const media = decodeMediaMessage(unwrapped)
  if (!media) return unwrapped
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
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

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1) return "0 KB"
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getImageMedia(message) {
  const replyPayload = decodeReplyMessage(message.content)
  if (replyPayload) return null
  const content = unwrapMessageContent(message.content)
  if (content === MESSAGE_RECALLED) return null
  const media = decodeMediaMessage(content)
  return media?.kind === "image" ? media : null
}

function buildMessageItems(messages) {
  const items = []
  for (const message of messages) {
    const imageMedia = getImageMedia(message)
    const previous = items[items.length - 1]
    const previousMessage = previous?.messages?.[previous.messages.length - 1]
    const withinGroupWindow = previousMessage
      ? Math.abs(new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime()) <= 120_000
      : false

    if (
      imageMedia &&
      previous?.type === "image-group" &&
      previous.senderId === message.sender?.id &&
      withinGroupWindow
    ) {
      previous.messages.push(message)
      previous.media.push(imageMedia)
      previous.id = `${previous.messages[0].id}-${message.id}`
      continue
    }

    if (imageMedia) {
      items.push({
        id: message.id,
        type: "image-group",
        senderId: message.sender?.id,
        sender: message.sender,
        messages: [message],
        media: [imageMedia],
      })
      continue
    }

    items.push({ id: message.id, type: "message", message })
  }
  return items.flatMap((item) =>
    item.type === "image-group" && item.messages.length === 1
      ? [{ id: item.messages[0].id, type: "message", message: item.messages[0] }]
      : [item]
  )
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
    <div className={`w-full min-w-0 overflow-hidden rounded-[1.25rem] px-2 py-2 shadow-sm ${mine ? "bg-primary/95 text-primary-foreground" : "bg-muted text-foreground"}`}>
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
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={togglePlay} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${mine ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`} aria-label={playing ? "Tạm dừng voice" : "Phát voice"}>
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="relative h-8 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-between gap-0.5 overflow-hidden">
              {waveBars.map((height, index) => {
                const active = index / Math.max(1, waveBars.length - 1) * 100 <= progress
                return (
                  <span
                    key={`${height}-${index}`}
                    className={`w-1 shrink-0 rounded-full transition-colors ${active ? mine ? "bg-white" : "bg-primary" : mine ? "bg-white/35" : "bg-muted-foreground/25"}`}
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
  const router = useRouter()
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
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 })
  const [imageDragging, setImageDragging] = useState(false)
  const [pendingImages, setPendingImages] = useState([])
  const [replyingTo, setReplyingTo] = useState(null)
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [showConversationInfo, setShowConversationInfo] = useState(false)
  const [infoPanelView, setInfoPanelView] = useState(null)
  const [conversationSettings, setConversationSettings] = useState({})
  const [messageSearchQuery, setMessageSearchQuery] = useState("")
  const [reportDraft, setReportDraft] = useState("")
  const [callState, setCallState] = useState(null)
  const [callStarting, setCallStarting] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  const [callMicEnabled, setCallMicEnabled] = useState(true)
  const [callCameraEnabled, setCallCameraEnabled] = useState(true)
  const [callPreviewPosition, setCallPreviewPosition] = useState(null)
  const [callError, setCallError] = useState("")
  const [incomingCall, setIncomingCall] = useState(null)
  const [incomingActionLoading, setIncomingActionLoading] = useState(false)
  const [remoteStream, setRemoteStream] = useState(null)
  const messagesEndRef = useRef(null)
  const imageInputRef = useRef(null)
  const pendingImagesRef = useRef([])
  const mediaRecorderRef = useRef(null)
  const callVideoRef = useRef(null)
  const callPreviewRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const callStreamRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const messageRefs = useRef(new Map())
  const dragDepthRef = useRef(0)
  const imageDragRef = useRef({ active: false, moved: false, originX: 0, originY: 0, startX: 0, startY: 0 })
  const handledSignalIdsRef = useRef(new Set())
  const callPreviewDragRef = useRef(null)
  const audioChunksRef = useRef([])
  const requestedConversationHandledRef = useRef(false)
  const lastTypingSentAtRef = useRef(0)

  const selectedConv = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConvId) || null,
    [conversations, selectedConvId]
  )
  const activeCallId = callState?.callId || ""
  const currentSettings = selectedConvId
    ? { ...defaultConversationSettings, ...(conversationSettings[selectedConvId] || {}) }
    : defaultConversationSettings
  const currentTheme = conversationThemes.find((theme) => theme.id === currentSettings.themeId) || conversationThemes[0]
  const conversationDisplayName = selectedConv?.otherUser
    ? currentSettings.nickname || selectedConv.otherUser.displayName || selectedConv.otherUser.username
    : ""
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
  const messageItems = useMemo(() => buildMessageItems(messages), [messages])
  const pinnedMessages = useMemo(
    () =>
      messages
        .filter((message) => message.isPinned && unwrapMessageContent(message.content) !== MESSAGE_RECALLED)
        .sort((a, b) => new Date(b.pinnedAt || b.createdAt) - new Date(a.pinnedAt || a.createdAt)),
    [messages]
  )
  const mediaMessages = useMemo(
    () =>
      messages.filter((message) => {
        const media = decodeMediaMessage(unwrapMessageContent(message.content))
        return media?.url && unwrapMessageContent(message.content) !== MESSAGE_RECALLED
      }),
    [messages]
  )
  const messageSearchResults = useMemo(() => {
    const query = messageSearchQuery.trim().toLowerCase()
    if (!query) return []
    return messages
      .filter((message) => previewMessage(message.content).toLowerCase().includes(query))
      .slice(-20)
      .reverse()
  }, [messageSearchQuery, messages])
  const typingLabel = useMemo(() => {
    if (!typingUsers.length) return ""
    if (typingUsers.length === 1) {
      return `${typingUsers[0].displayName || typingUsers[0].username || "Người dùng"} đang nhập...`
    }
    return `${typingUsers.length} người đang nhập...`
  }, [typingUsers])

  const clampCallPreviewPosition = useCallback((position) => {
    if (typeof window === "undefined") return position
    const rect = callPreviewRef.current?.getBoundingClientRect()
    const width = rect?.width || 96
    const height = rect?.height || 128
    const padding = 12
    return {
      x: clamp(position.x, padding, window.innerWidth - width - padding),
      y: clamp(position.y, padding, window.innerHeight - height - padding),
    }
  }, [])

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
    if (!selectedConvId || typeof window === "undefined") return undefined
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(`fishviet:conversation:${selectedConvId}`)
        if (!raw) return
        const saved = JSON.parse(raw)
        setConversationSettings((items) => ({
          ...items,
          [selectedConvId]: { ...defaultConversationSettings, ...saved },
        }))
        setReportDraft(saved.reportReason || "")
      } catch {
        setReportDraft("")
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [selectedConvId])

  useEffect(() => {
    if (!selectedConvId || !inputText.trim()) return undefined
    const sendTyping = () => {
      const now = Date.now()
      if (now - lastTypingSentAtRef.current < 1_800) return
      lastTypingSentAtRef.current = now
      fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConvId }),
      }).catch(() => {})
    }
    sendTyping()
    const timer = window.setInterval(sendTyping, 2_000)
    return () => window.clearInterval(timer)
  }, [inputText, selectedConvId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, selectedConvId, typingLabel])

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

  useEffect(() => {
    if (callState?.mode !== "video" || !remoteStream || typeof window === "undefined") return undefined

    const placePreview = () => {
      const rect = callPreviewRef.current?.getBoundingClientRect()
      const width = rect?.width || 96
      const height = rect?.height || 128
      setCallPreviewPosition((position) => {
        if (position) return clampCallPreviewPosition(position)
        const bottomOffset = window.matchMedia("(min-width: 640px)").matches ? 112 : 96
        return clampCallPreviewPosition({
          x: window.innerWidth - width - 16,
          y: window.innerHeight - height - bottomOffset,
        })
      })
    }

    placePreview()
    window.addEventListener("resize", placePreview)
    window.visualViewport?.addEventListener("resize", placePreview)
    return () => {
      window.removeEventListener("resize", placePreview)
      window.visualViewport?.removeEventListener("resize", placePreview)
    }
  }, [callState?.mode, clampCallPreviewPosition, remoteStream])

  useEffect(() => () => {
    peerConnectionRef.current?.close()
    stopMediaStream(callStreamRef.current)
  }, [])

  useEffect(() => {
    if (!currentUser?.id || typeof document === "undefined") return undefined

    const touchPresence = () => {
      if (document.visibilityState === "hidden") return
      fetch("/api/presence", { method: "POST", keepalive: true }).catch(() => {})
    }

    touchPresence()
    const timer = window.setInterval(touchPresence, 30_000)
    window.addEventListener("focus", touchPresence)
    document.addEventListener("visibilitychange", touchPresence)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", touchPresence)
      document.removeEventListener("visibilitychange", touchPresence)
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (!imageViewer) return undefined

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setImageViewer(null)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [imageViewer])

  useEffect(() => {
    pendingImagesRef.current = pendingImages
  }, [pendingImages])

  useEffect(() => () => {
    pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.url))
  }, [])

  const openImageViewer = (media) => {
    setImageViewer(media)
    setImageZoom(1)
    setImagePan({ x: 0, y: 0 })
    setImageDragging(false)
    imageDragRef.current = { active: false, moved: false, originX: 0, originY: 0, startX: 0, startY: 0 }
  }

  const setSmoothImageZoom = (nextZoom) => {
    const normalizedZoom = Math.min(4, Math.max(0.5, Number(nextZoom.toFixed(2))))
    setImageZoom(normalizedZoom)
    if (normalizedZoom <= 1) setImagePan({ x: 0, y: 0 })
  }

  const resetImageView = () => {
    setImageZoom(1)
    setImagePan({ x: 0, y: 0 })
  }

  const zoomOutImage = () => setImageZoom((zoom) => {
    const nextZoom = Math.max(0.5, Number((zoom - 0.25).toFixed(2)))
    if (nextZoom <= 1) setImagePan({ x: 0, y: 0 })
    return nextZoom
  })
  const zoomInImage = () => setImageZoom((zoom) => Math.min(4, Number((zoom + 0.25).toFixed(2))))
  const handleImageWheel = (event) => {
    event.preventDefault()
    const multiplier = event.deltaY > 0 ? 0.9 : 1.1
    setImageZoom((zoom) => {
      const nextZoom = Math.min(4, Math.max(0.5, Number((zoom * multiplier).toFixed(2))))
      if (nextZoom <= 1) setImagePan({ x: 0, y: 0 })
      return nextZoom
    })
  }

  const handleImagePointerDown = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (imageZoom <= 1) return
    imageDragRef.current = {
      active: true,
      moved: false,
      originX: imagePan.x,
      originY: imagePan.y,
      startX: event.clientX,
      startY: event.clientY,
    }
    setImageDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handleImagePointerMove = (event) => {
    if (!imageDragRef.current.active) return
    event.preventDefault()
    event.stopPropagation()
    const nextX = imageDragRef.current.originX + event.clientX - imageDragRef.current.startX
    const nextY = imageDragRef.current.originY + event.clientY - imageDragRef.current.startY
    if (Math.abs(nextX - imageDragRef.current.originX) > 2 || Math.abs(nextY - imageDragRef.current.originY) > 2) {
      imageDragRef.current.moved = true
    }
    setImagePan({ x: nextX, y: nextY })
  }

  const handleImagePointerUp = (event) => {
    if (!imageDragRef.current.active) return
    event.preventDefault()
    event.stopPropagation()
    imageDragRef.current.active = false
    setImageDragging(false)
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const handleImageDoubleClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (imageZoom > 1) {
      resetImageView()
      return
    }
    setSmoothImageZoom(2)
  }

  const sendTextMessage = async (content, { force = false } = {}) => {
    if (!content || !selectedConvId || (sending && !force)) return
    if (currentSettings.blocked) {
      setError("Bạn đã chặn cuộc trò chuyện này. Bỏ chặn để tiếp tục nhắn tin.")
      return
    }
    if (currentSettings.restricted) {
      setError("Cuộc trò chuyện đang bị hạn chế. Bỏ hạn chế để gửi tin nhắn.")
      return
    }

    const outgoingContent = encodeReplyMessage(replyingTo, content)
    setSending(true)
    setActivePicker(null)
    setError("")
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConvId, content: outgoingContent }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể gửi tin nhắn")
      setMessages((items) => [...items, data])
      setInputText("")
      setReplyingTo(null)
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
    if (pendingImages.length) {
      await sendPendingImages()
      return
    }
    await sendTextMessage(inputText.trim())
  }

  const updateConversationSetting = (patch) => {
    if (!selectedConvId || typeof window === "undefined") return
    setConversationSettings((items) => {
      const nextSettings = {
        ...defaultConversationSettings,
        ...(items[selectedConvId] || {}),
        ...patch,
      }
      window.localStorage.setItem(`fishviet:conversation:${selectedConvId}`, JSON.stringify(nextSettings))
      return { ...items, [selectedConvId]: nextSettings }
    })
  }

  const sendQuickLike = () => sendTextMessage(currentSettings.quickEmoji || "👍")

  const applyUpdatedMessage = (updatedMessage) => {
    if (!updatedMessage?.id) return
    setMessages((items) => items.map((item) => item.id === updatedMessage.id ? updatedMessage : item))
    setConversations((items) =>
      items.map((item) =>
        item.id === selectedConvId && item.lastMessage?.createdAt === updatedMessage.createdAt
          ? {
              ...item,
              lastMessage: {
                ...item.lastMessage,
                content: updatedMessage.content,
                createdAt: updatedMessage.createdAt,
              },
            }
          : item
      )
    )
  }

  const buildReplyTarget = (message) => ({
    id: message.id,
    senderName: message.sender?.displayName || message.sender?.username || "Người dùng",
    preview: previewMessage(message.content),
  })

  const togglePinMessage = async (message) => {
    if (!selectedConvId || !message?.id || unwrapMessageContent(message.content) === MESSAGE_RECALLED) return
    setError("")
    try {
      const response = await fetch(`/api/messages/${selectedConvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id, action: message.isPinned ? "unpin" : "pin" }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể cập nhật ghim tin nhắn")
      applyUpdatedMessage(data)
    } catch (caught) {
      setError(caught.message || "Không thể cập nhật ghim tin nhắn")
    }
  }

  const copyMessageValue = async (message) => {
    const content = unwrapMessageContent(message.content)
    const media = decodeMediaMessage(content)
    const value = media?.url || media?.label || content
    if (!value || value === MESSAGE_RECALLED) return
    try {
      await navigator.clipboard?.writeText(value)
      setError("")
    } catch {
      setError("Không thể sao chép nội dung trên trình duyệt này.")
    }
  }

  const scrollToMessage = (messageId) => {
    const node = messageRefs.current.get(messageId)
    if (!node) return
    node.scrollIntoView({ behavior: "smooth", block: "center" })
    node.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background")
    window.setTimeout(() => {
      node.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background")
    }, 1200)
  }

  const recallMessage = async (message) => {
    if (!selectedConvId || message.sender?.id !== currentUser.id || unwrapMessageContent(message.content) === MESSAGE_RECALLED) return
    setError("")
    try {
      const response = await fetch(`/api/messages/${selectedConvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id, action: "recall" }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể thu hồi tin nhắn")
      applyUpdatedMessage(data)
    } catch (caught) {
      setError(caught.message || "Không thể thu hồi tin nhắn")
    }
  }

  const uploadMessageFile = async (file) => {
    const form = new FormData()
    form.set("file", file)
    form.set("purpose", "message")
    const response = await fetch("/api/uploads", { method: "POST", body: form })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Không thể tải tệp lên")
    return data
  }

  const selectImageFiles = (files) => {
    dragDepthRef.current = 0
    setDragActive(false)
    const imageFiles = Array.from(files || []).filter((file) => file.type?.startsWith("image/"))
    if (!imageFiles.length) return
    if (imageFiles.length !== Array.from(files || []).length) {
      setError("Chỉ hỗ trợ gửi ảnh trong nút này.")
    }
    setPendingImages((items) => [
      ...items,
      ...imageFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        url: URL.createObjectURL(file),
        name: file.name || "image",
        size: file.size || 0,
      })),
    ].slice(0, 10))
    setActivePicker(null)
    setError("")
  }

  const removePendingImage = (imageId) => {
    setPendingImages((items) => {
      const removed = items.find((item) => item.id === imageId)
      if (removed?.url) URL.revokeObjectURL(removed.url)
      return items.filter((item) => item.id !== imageId)
    })
  }

  const clearPendingImages = () => {
    dragDepthRef.current = 0
    setDragActive(false)
    pendingImages.forEach((image) => URL.revokeObjectURL(image.url))
    setPendingImages([])
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  const sendPendingImages = async () => {
    if (!pendingImages.length || sending) return
    const imagesToSend = pendingImages
    dragDepthRef.current = 0
    setDragActive(false)
    setPendingImages([])
    if (imageInputRef.current) imageInputRef.current.value = ""
    setSending(true)
    setError("")
    try {
      for (const image of imagesToSend) {
        const uploaded = await uploadMessageFile(image.file)
        await sendTextMessage(encodeMediaMessage("image", uploaded.url, image.name || "image"), { force: true })
      }
      imagesToSend.forEach((image) => URL.revokeObjectURL(image.url))
    } catch (caught) {
      imagesToSend.forEach((image) => URL.revokeObjectURL(image.url))
      setError(caught.message || "Không thể gửi ảnh")
      setSending(false)
    }
  }

  const handleImageDrop = (event) => {
    event.preventDefault()
    dragDepthRef.current = 0
    setDragActive(false)
    selectImageFiles(event.dataTransfer?.files)
  }

  const handleImageDragOver = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return
    event.preventDefault()
    if (!pendingImages.length) setDragActive(true)
  }

  const handleImageDragEnter = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return
    event.preventDefault()
    dragDepthRef.current += 1
    if (!pendingImages.length) setDragActive(true)
  }

  const handleImageDragLeave = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setDragActive(false)
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

  const openCallScreen = useCallback((url) => {
    const shouldUsePopup = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
    if (!shouldUsePopup) {
      router.push(url)
      return
    }

    const popup = window.open(url, "fishviet-messenger-call", "popup,width=1180,height=760")
    if (popup) {
      popup.focus()
      return
    }
    router.push(url)
  }, [router])

  const startCall = (mode) => {
    if (callStarting || !selectedConvId) return
    setCallError("")
    setCallStarting(true)
    openCallScreen(`/messages/call?conversationId=${encodeURIComponent(selectedConvId)}&mode=${encodeURIComponent(mode)}`)
    setCallStarting(false)
  }

  const finishCall = useCallback(() => {
    cleanupCallConnection()
    setCallState(null)
    setCallSeconds(0)
    setCallMicEnabled(true)
    setCallCameraEnabled(true)
    setCallPreviewPosition(null)
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

  const startCallPreviewDrag = (event) => {
    if (!callPreviewPosition) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    callPreviewDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: callPreviewPosition.x,
      originY: callPreviewPosition.y,
    }
  }

  const moveCallPreview = (event) => {
    const drag = callPreviewDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setCallPreviewPosition(clampCallPreviewPosition({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    }))
  }

  const stopCallPreviewDrag = (event) => {
    if (callPreviewDragRef.current?.pointerId === event.pointerId) {
      callPreviewDragRef.current = null
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }
  }

  const acceptIncomingCall = () => {
    const callConversationId = incomingCall?.conversationId || selectedConvId
    if (!incomingCall || incomingActionLoading || !callConversationId) return
    setSelectedConvId(callConversationId)
    openCallScreen(`/messages/call?conversationId=${encodeURIComponent(callConversationId)}&callId=${encodeURIComponent(incomingCall.id)}&mode=${encodeURIComponent(incomingCall.mode)}&incoming=1`)
    setIncomingCall(null)
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
      const localDescription = peerConnectionRef.current?.localDescription
      if (localDescription?.type === "offer") {
        await postCallSignal(activeCallId, "offer", localDescription)
      }
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
    if (!selectedConvId || typeof EventSource === "undefined") return undefined
    const source = new EventSource(`/api/messages/events?conversationId=${encodeURIComponent(selectedConvId)}`)

    const handleMessageEvent = (event) => {
      const message = JSON.parse(event.data)
      setMessages((items) => items.some((item) => item.id === message.id) ? items.map((item) => item.id === message.id ? message : item) : [...items, message])
      setConversations((items) =>
        items.map((item) =>
          item.id === message.conversationId
            ? {
                ...item,
                lastMessage: {
                  content: message.content,
                  senderName: message.sender?.displayName || message.sender?.username,
                  createdAt: message.createdAt,
                },
                updatedAt: message.createdAt,
                unread: item.id === selectedConvId ? 0 : (item.unread || 0) + 1,
              }
            : item
        )
      )
    }

    const handleCallEvent = async (event) => {
      const call = JSON.parse(event.data)
      if (call.status === "ringing" && call.callerId !== currentUser.id && !activeCallId) {
        setIncomingCall(call)
        return
      }
      if (incomingCall?.id === call.id && call.status !== "ringing") {
        setIncomingCall(null)
      }
      if (activeCallId === call.id && ["declined", "ended"].includes(call.status)) {
        await endCall({ notify: false })
      } else if (activeCallId === call.id && call.status === "active") {
        setCallState((current) => current ? { ...current, status: "active" } : current)
      }
    }

    const handleSignalEvent = (event) => {
      handleRemoteSignal(JSON.parse(event.data))
    }

    const handleStreamError = (event) => {
      const data = JSON.parse(event.data)
      setCallError(data.message || "Realtime connection error.")
    }

    const handleTypingEvent = (event) => {
      const data = JSON.parse(event.data)
      setTypingUsers(Array.isArray(data.users) ? data.users : [])
    }

    const handlePresenceEvent = (event) => {
      const data = JSON.parse(event.data)
      const presenceUser = data.user
      if (!presenceUser?.id) return
      setConversations((items) =>
        items.map((item) =>
          item.otherUser?.id === presenceUser.id
            ? { ...item, otherUser: { ...item.otherUser, ...presenceUser } }
            : item
        )
      )
    }

    source.addEventListener("message", handleMessageEvent)
    source.addEventListener("message-update", handleMessageEvent)
    source.addEventListener("call", handleCallEvent)
    source.addEventListener("signal", handleSignalEvent)
    source.addEventListener("typing", handleTypingEvent)
    source.addEventListener("presence", handlePresenceEvent)
    source.addEventListener("stream-error", handleStreamError)
    source.onerror = () => {
      setCallError("Realtime đang tự kết nối lại...")
    }

    return () => source.close()
  }, [activeCallId, currentUser.id, endCall, handleRemoteSignal, incomingCall?.id, selectedConvId])

  useEffect(() => {
    if (typeof EventSource === "undefined") return undefined
    const source = new EventSource("/api/messages/events")

    const handleCallEvent = (event) => {
      const call = JSON.parse(event.data)
      if (call.status === "ringing" && call.callerId !== currentUser.id && !activeCallId) {
        setIncomingCall((current) => current?.id === call.id ? current : call)
        window.navigator?.vibrate?.([180, 80, 180])
        return
      }
      if (incomingCall?.id === call.id && call.status !== "ringing") {
        setIncomingCall(null)
      }
    }

    const handleStreamError = () => {
      setCallError("Realtime cuộc gọi đang tự kết nối lại...")
    }

    source.addEventListener("call", handleCallEvent)
    source.addEventListener("stream-error", handleStreamError)
    return () => source.close()
  }, [activeCallId, currentUser.id, incomingCall?.id])

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
    setTypingUsers([])
    setShowConversationInfo(false)
    setLoadingMessages(true)
    setSelectedConvId(conversationId)
  }

  const renderConversation = (conversation) => {
    const other = conversation.otherUser || {}
    const conversationNickname = conversationSettings[conversation.id]?.nickname
    const name = conversationNickname || other.displayName || other.username || "Người dùng"
    const active = conversation.id === selectedConvId
    return (
      <button
        key={conversation.id}
        type="button"
        onClick={() => selectConversation(conversation.id)}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-200 hover:bg-muted/70 ${active ? "bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]" : ""} ${handoffPulse && active ? "shadow-[inset_3px_0_0_hsl(var(--primary))]" : ""}`}
      >
        <div className="relative shrink-0">
          <Avatar className="h-14 w-14 ring-1 ring-primary/20">
            {other.avatarUrl && <AvatarImage src={other.avatarUrl} alt={name} className="object-cover" />}
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {other.isOnline && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[15px] font-semibold">{name}</span>
            {conversation.lastMessage?.createdAt && (
              <span className="shrink-0 text-[11px] text-muted-foreground">{formatTimeAgo(conversation.lastMessage.createdAt)}</span>
            )}
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <p className="truncate text-[13px] text-muted-foreground">
              {conversation.lastMessage?.content ? previewMessage(conversation.lastMessage.content) : "Chưa có tin nhắn"}
            </p>
            {conversation.unread > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
          </div>
        </div>
      </button>
    )
  }

  const renderConversationInfo = () => {
    if (!selectedConv) return null
    const other = selectedConv.otherUser || {}
    const name = conversationDisplayName || other.displayName || other.username || "Người dùng"
    const quickActions = [
      { label: "Trang cá nhân", icon: UserCircle },
      { label: "Tắt thông báo", icon: Bell },
      { label: "Tìm kiếm", icon: Search },
    ]
    const openPanel = (panel) => setInfoPanelView((view) => view === panel ? null : panel)
    const actionForIcon = (Icon) => {
      if (Icon === Pin) return "pinned"
      if (Icon === ImageIcon) return "media"
      if (Icon === FileText) return "files"
      if (Icon === Palette) return "theme"
      if (Icon === Smile) return "emoji"
      if (Icon === UserCircle) return "nickname"
      if (Icon === BellOff) return "mute"
      if (Icon === Shield) return "permissions"
      if (Icon === RotateCcw) return "vanish"
      if (Icon === Eye) return "receipts"
      if (Icon === Lock) return "encryption"
      if (Icon === Ban) return "restrict"
      if (Icon === Minus) return "block"
      if (Icon === Flag) return "report"
      return null
    }
    const descriptionForAction = (action, fallback) => {
      if (action === "theme") return currentTheme.label
      if (action === "emoji") return currentSettings.quickEmoji
      if (action === "nickname") return currentSettings.nickname || "Mặc định"
      if (action === "mute") return currentSettings.muted ? "Đang tắt" : "Đang bật"
      if (action === "permissions") return currentSettings.messagePermission === "everyone" ? "Cho phép" : currentSettings.messagePermission === "requests" ? "Tin nhắn chờ" : "Đã chặn"
      if (action === "vanish") return currentSettings.vanishMode ? "Bật" : "Tắt"
      if (action === "receipts") return currentSettings.readReceipts ? "Bật" : "Tắt"
      if (action === "restrict") return currentSettings.restricted ? "Đang hạn chế" : fallback
      if (action === "block") return currentSettings.blocked ? "Đã chặn" : fallback
      return fallback
    }
    const sections = [
      {
        title: "Thông tin về đoạn chat",
        items: [{ label: "Xem tin nhắn đã ghim", icon: Pin }],
      },
      {
        title: "Tùy chỉnh đoạn chat",
        items: [
          { label: "Đổi chủ đề", icon: Palette },
          { label: "Thay đổi biểu tượng cảm xúc", icon: Smile },
          { label: "Chỉnh sửa biệt danh", icon: UserCircle },
        ],
      },
      {
        title: "File phương tiện và file",
        items: [
          { label: "File phương tiện", icon: ImageIcon },
          { label: "File", icon: FileText },
        ],
      },
      {
        title: "Quyền riêng tư và hỗ trợ",
        items: [
          { label: "Tắt thông báo", icon: BellOff },
          { label: "Quyền nhắn tin", icon: Shield },
          { label: "Tin nhắn tự hủy", icon: RotateCcw },
          { label: "Thông báo đã đọc", icon: Eye, description: "Bật" },
          { label: "Xác minh mã hóa đầu cuối", icon: Lock },
          { label: "Hạn chế", icon: Ban },
          { label: "Chặn", icon: Minus },
          { label: "Báo cáo", icon: Flag, description: "Đóng góp ý kiến và báo cáo cuộc trò chuyện" },
        ],
      },
    ]

    const renderInfoPanelView = () => {
      if (!infoPanelView) return null
      const title = infoPanelView === "pinned" ? "Tin nhắn đã ghim" : infoPanelView === "media" ? "File phương tiện" : "File"
      const items = infoPanelView === "pinned"
        ? pinnedMessages
        : infoPanelView === "media"
          ? mediaMessages.filter((message) => decodeMediaMessage(unwrapMessageContent(message.content))?.kind === "image")
          : mediaMessages
      const closeButton = (
        <button type="button" onClick={() => setInfoPanelView(null)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-background" aria-label="Đóng">
          <X className="h-4 w-4" />
        </button>
      )
      const settingTitles = {
        search: "Tìm kiếm trong đoạn chat",
        theme: "Đổi chủ đề",
        emoji: "Biểu tượng cảm xúc",
        nickname: "Chỉnh sửa biệt danh",
        mute: "Tắt thông báo",
        permissions: "Quyền nhắn tin",
        vanish: "Tin nhắn tự hủy",
        receipts: "Thông báo đã đọc",
        encryption: "Mã hóa đầu cuối",
        restrict: "Hạn chế",
        block: "Chặn",
        report: "Báo cáo",
      }

      if (settingTitles[infoPanelView]) {
        return (
          <section className="mt-5 rounded-2xl border border-border/70 bg-muted/35 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black">{settingTitles[infoPanelView]}</p>
              {closeButton}
            </div>

            {infoPanelView === "search" && (
              <div className="mt-3 space-y-3">
                <label className="flex h-10 items-center gap-2 rounded-full bg-background px-3 text-muted-foreground ring-1 ring-border/70">
                  <Search className="h-4 w-4" />
                  <input
                    value={messageSearchQuery}
                    onChange={(event) => setMessageSearchQuery(event.target.value)}
                    placeholder="Tìm tin nhắn"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
                  />
                </label>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {messageSearchResults.length ? messageSearchResults.map((message) => (
                    <button key={message.id} type="button" onClick={() => scrollToMessage(message.id)} className="flex w-full flex-col rounded-xl bg-background/70 px-3 py-2 text-left hover:bg-background">
                      <span className="line-clamp-2 text-xs font-bold">{previewMessage(message.content)}</span>
                      <span className="mt-1 text-[11px] text-muted-foreground">{formatTimeAgo(message.createdAt)}</span>
                    </button>
                  )) : (
                    <p className="rounded-xl bg-background/60 px-3 py-4 text-center text-xs font-semibold text-muted-foreground">Nhập từ khóa để tìm trong đoạn chat.</p>
                  )}
                </div>
              </div>
            )}

            {infoPanelView === "theme" && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {conversationThemes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => updateConversationSetting({ themeId: theme.id })}
                    className={`rounded-2xl bg-background/70 p-2 text-xs font-bold ring-1 ${currentSettings.themeId === theme.id ? "ring-primary" : "ring-border/70"}`}
                  >
                    <span className="mx-auto mb-2 block h-9 w-9 rounded-full" style={{ backgroundColor: theme.color }} />
                    {theme.label}
                  </button>
                ))}
              </div>
            )}

            {infoPanelView === "emoji" && (
              <div className="mt-3 grid grid-cols-6 gap-2">
                {[...stickerItems.slice(0, 12), "👍", "❤️", "😂", "🔥", "👏", "🎣"].map((item) => (
                  <button key={item} type="button" onClick={() => updateConversationSetting({ quickEmoji: item })} className={`flex aspect-square items-center justify-center rounded-xl bg-background/70 text-xl ring-1 ${currentSettings.quickEmoji === item ? "ring-primary" : "ring-border/70"}`}>
                    {item}
                  </button>
                ))}
              </div>
            )}

            {infoPanelView === "nickname" && (
              <div className="mt-3 space-y-2">
                <input
                  value={currentSettings.nickname}
                  onChange={(event) => updateConversationSetting({ nickname: event.target.value })}
                  placeholder={selectedConv.otherUser?.displayName || selectedConv.otherUser?.username || "Biệt danh"}
                  className="h-11 w-full rounded-xl bg-background px-3 text-sm font-semibold outline-none ring-1 ring-border/70 focus:ring-primary/50"
                />
                <button type="button" onClick={() => updateConversationSetting({ nickname: "" })} className="text-xs font-bold text-primary">Dùng tên hồ sơ</button>
              </div>
            )}

            {["mute", "vanish", "receipts", "restrict", "block"].includes(infoPanelView) && (
              <div className="mt-3 rounded-xl bg-background/70 p-3">
                <label className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold">
                    {infoPanelView === "mute" ? "Tắt thông báo cuộc trò chuyện" : infoPanelView === "vanish" ? "Bật tin nhắn tự hủy" : infoPanelView === "receipts" ? "Gửi thông báo đã đọc" : infoPanelView === "restrict" ? "Hạn chế cuộc trò chuyện" : "Chặn người dùng này"}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(currentSettings[infoPanelView === "mute" ? "muted" : infoPanelView === "vanish" ? "vanishMode" : infoPanelView === "receipts" ? "readReceipts" : infoPanelView === "restrict" ? "restricted" : "blocked"])}
                    onChange={(event) => {
                      const key = infoPanelView === "mute" ? "muted" : infoPanelView === "vanish" ? "vanishMode" : infoPanelView === "receipts" ? "readReceipts" : infoPanelView === "restrict" ? "restricted" : "blocked"
                      updateConversationSetting({ [key]: event.target.checked })
                    }}
                    className="h-5 w-5 accent-primary"
                  />
                </label>
              </div>
            )}

            {infoPanelView === "permissions" && (
              <div className="mt-3 grid gap-2">
                {[
                  ["everyone", "Cho phép nhắn tin"],
                  ["requests", "Chuyển vào tin nhắn chờ"],
                  ["blocked", "Không nhận tin nhắn mới"],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => updateConversationSetting({ messagePermission: value, blocked: value === "blocked" })} className={`rounded-xl px-3 py-2 text-left text-sm font-bold ring-1 ${currentSettings.messagePermission === value ? "bg-primary/10 text-primary ring-primary/30" : "bg-background/70 ring-border/70"}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {infoPanelView === "encryption" && (
              <p className="mt-3 rounded-xl bg-background/70 px-3 py-3 text-xs font-semibold text-muted-foreground">
                Đoạn chat dùng kết nối riêng tư trong FishViet. Khóa xác minh có thể bổ sung sau khi backend hỗ trợ mã hóa đầu cuối thực sự.
              </p>
            )}

            {infoPanelView === "report" && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={reportDraft}
                  onChange={(event) => setReportDraft(event.target.value)}
                  placeholder="Mô tả vấn đề trong cuộc trò chuyện"
                  className="min-h-24 w-full resize-none rounded-xl bg-background px-3 py-2 text-sm outline-none ring-1 ring-border/70 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateConversationSetting({ reportReason: reportDraft.trim() })
                    setError("Đã lưu báo cáo cuộc trò chuyện để admin xem xét.")
                  }}
                  className="flex h-10 w-full items-center justify-center rounded-xl bg-primary px-3 text-sm font-black text-primary-foreground"
                >
                  Gửi báo cáo
                </button>
              </div>
            )}
          </section>
        )
      }

      return (
        <section className="mt-5 rounded-2xl border border-border/70 bg-muted/35 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black">{title}</p>
            <button type="button" onClick={() => setInfoPanelView(null)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-background" aria-label="Đóng">
              <X className="h-4 w-4" />
            </button>
          </div>
          {items.length === 0 ? (
            <p className="mt-3 rounded-xl bg-background/60 px-3 py-4 text-center text-xs font-semibold text-muted-foreground">
              {infoPanelView === "pinned" ? "Chưa có tin nhắn nào được ghim." : "Chưa có file phương tiện nào."}
            </p>
          ) : infoPanelView === "media" ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {items.slice(0, 18).map((message) => {
                const media = decodeMediaMessage(unwrapMessageContent(message.content))
                if (media?.kind !== "image") return null
                return (
                  <button key={message.id} type="button" onClick={() => openImageViewer(media)} className="aspect-square overflow-hidden rounded-xl bg-background ring-1 ring-border/70">
                    <img src={media.url} alt={media.label || "Ảnh"} draggable={false} className="h-full w-full object-cover" />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {items.slice(0, 12).map((message) => {
                const media = decodeMediaMessage(unwrapMessageContent(message.content))
                const RowIcon = infoPanelView === "files" ? FileText : Pin
                return (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => {
                      if (infoPanelView === "files" && media?.url) window.open(media.url, "_blank", "noopener,noreferrer")
                      else scrollToMessage(message.id)
                    }}
                    className="flex w-full items-start gap-2 rounded-xl bg-background/70 px-3 py-2 text-left hover:bg-background"
                  >
                    <RowIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-xs font-bold">{previewMessage(message.content)}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {message.sender?.displayName || message.sender?.username || "Người dùng"} · {formatTimeAgo(message.pinnedAt || message.createdAt)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      )
    }

    return (
      <aside className="custom-scrollbar flex h-full min-h-0 w-full flex-col overflow-y-auto border-l border-border/70 bg-card px-4 pb-4 pt-5 text-foreground md:w-[340px] lg:w-[380px]">
        <div className="flex items-center justify-between md:hidden">
          <p className="text-sm font-black">Thông tin đoạn chat</p>
          <button type="button" onClick={() => setShowConversationInfo(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted" aria-label="Đóng thông tin">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex flex-col items-center text-center md:mt-0">
          <Avatar className="h-20 w-20 ring-4 ring-primary/10">
            {other.avatarUrl && <AvatarImage src={other.avatarUrl} alt={name} className="object-cover" />}
            <AvatarFallback className="bg-primary/10 text-lg font-black text-primary">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <p className="mt-3 text-lg font-black">{name}</p>
          <p className="text-sm text-muted-foreground">{formatPresence(other)}</p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Được mã hóa đầu cuối
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            const quickAction = Icon === UserCircle ? "profile" : Icon === Bell ? "mute" : "search"
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  if (quickAction === "profile" && selectedConv.otherUser?.username) {
                    router.push(`/profile/${selectedConv.otherUser.username}`)
                    return
                  }
                  openPanel(quickAction)
                }}
                className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl p-2 text-center hover:bg-muted ${infoPanelView === quickAction ? "bg-muted" : ""}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="line-clamp-2 text-xs font-semibold">{action.label}</span>
              </button>
            )
          })}
        </div>

        {renderInfoPanelView()}

        <div className="mt-6 space-y-5">
          {sections.map((section) => (
            <section key={section.title}>
              <button type="button" className="flex w-full items-center justify-between rounded-xl py-1 text-left text-sm font-black">
                {section.title}
                <ChevronUp className="h-4 w-4" />
              </button>
              <div className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const itemAction = actionForIcon(Icon)
                  const description = descriptionForAction(itemAction, item.description)
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => itemAction && openPanel(itemAction)}
                      className={`flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left hover:bg-muted ${itemAction && infoPanelView === itemAction ? "bg-muted" : ""}`}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{item.label}</span>
                        {description && <span className="block truncate text-xs text-muted-foreground">{description}</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </aside>
    )
  }

  return (
    <main id="main-content" className="h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <div className="grid h-full w-full overflow-hidden">
        <section className="min-h-0 min-w-0">
          <div className={`grid h-full min-h-0 overflow-hidden bg-background transition-shadow duration-500 md:grid-cols-[360px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)] ${showConversationInfo && selectedConv ? "xl:grid-cols-[420px_minmax(0,1fr)_380px]" : ""} ${handoffPulse ? "shadow-[0_0_0_2px_hsl(var(--primary)/0.45),0_0_45px_hsl(var(--primary)/0.28)]" : ""}`}>
            <aside className={`${selectedConvId ? "hidden md:flex" : "flex"} min-h-0 flex-col border-border/70 bg-card md:border-r`}>
              <div className="border-b border-border/70 px-4 pb-3 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h1 className="text-[28px] font-black tracking-[-0.03em] text-foreground">Messenger</h1>
                    <p className="mt-0.5 text-xs text-muted-foreground">FishViet chat</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href="/" className="kinetic flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-primary/10 hover:text-primary" aria-label="Về trang chủ" title="Về trang chủ">
                      <House className="h-4 w-4" />
                    </Link>
                    <button type="button" className="kinetic flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-primary/10 hover:text-primary" aria-label="Tùy chọn tin nhắn">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <label className="mt-4 flex h-11 items-center gap-2 rounded-full bg-muted/80 px-4 text-muted-foreground ring-1 ring-border/45 focus-within:bg-background focus-within:ring-primary/35">
                  <Search className="h-4 w-4 shrink-0" />
                  <input
                    value={conversationQuery}
                    onChange={(event) => setConversationQuery(event.target.value)}
                    placeholder="Tìm trên Messenger"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </label>
                <div className="custom-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                  {["Tất cả", "Chưa đọc", "Nhóm", "Lưu trữ"].map((filter, index) => (
                    <button
                      key={filter}
                      type="button"
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${index === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                {loadingConversations ? (
                  <div className="flex h-48 items-center justify-center text-primary">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex h-56 flex-col items-center justify-center px-6 text-center text-muted-foreground">
                    <MessageCircle className="h-10 w-10 text-primary/60" />
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

            <section
              className={`${selectedConvId ? "flex" : "hidden md:flex"} relative min-h-0 flex-col overflow-hidden bg-background/35`}
              style={{ "--chat-theme": currentTheme.color }}
              onDragEnter={handleImageDragEnter}
              onDragOver={handleImageDragOver}
              onDragLeave={handleImageDragLeave}
              onDrop={handleImageDrop}
            >
              {dragActive && (
                <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-3xl border-2 border-dashed border-primary bg-primary/10 text-sm font-bold text-primary backdrop-blur-sm">
                  Thả ảnh vào đây
                </div>
              )}
              {selectedConv ? (
                <>
                  <div className="relative z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-card/95 px-3 shadow-sm md:px-4">
                    <button type="button" onClick={() => { setSelectedConvId(null); setMessages([]) }} className="kinetic flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10 md:hidden" aria-label="Quay lại danh sách">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <Avatar className="h-11 w-11 ring-2 ring-primary/15">
                      {selectedConv.otherUser?.avatarUrl && <AvatarImage src={selectedConv.otherUser.avatarUrl} alt={selectedConv.otherUser.displayName || selectedConv.otherUser.username} className="object-cover" />}
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{(selectedConv.otherUser?.displayName || selectedConv.otherUser?.username || "ND").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold text-foreground">{conversationDisplayName || selectedConv.otherUser?.displayName || selectedConv.otherUser?.username}</h2>
                      <p className={`truncate text-xs ${selectedConv.otherUser?.isOnline ? "text-primary" : "text-muted-foreground"}`}>{formatPresence(selectedConv.otherUser)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-primary">
                      <button type="button" onClick={() => startCall("audio")} disabled={callStarting} className="kinetic flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary/10 disabled:opacity-45 md:h-9 md:w-9" aria-label="Gọi thoại">
                        {callStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                      </button>
                      <button type="button" onClick={() => startCall("video")} disabled={callStarting} className="kinetic flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary/10 disabled:opacity-45 md:h-9 md:w-9" aria-label="Gọi video">
                        {callStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                      </button>
                      <button type="button" onClick={() => setShowConversationInfo((open) => !open)} className={`kinetic hidden h-9 w-9 items-center justify-center rounded-full hover:bg-primary/10 sm:flex ${showConversationInfo ? "bg-primary/10" : ""}`} aria-label="Thông tin hội thoại" aria-expanded={showConversationInfo}>
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-[57px] top-16 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--chat-theme)_22%,transparent),transparent_34%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.35))]" />
                  </div>

                  <div className={`relative z-10 min-h-0 flex-1 space-y-1.5 px-2 py-3 sm:px-4 ${messages.length > 0 ? "custom-scrollbar overflow-y-auto" : "overflow-hidden"}`}>
                    {loadingMessages ? (
                      <div className="flex h-full items-center justify-center text-primary">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                          {selectedConv.otherUser?.avatarUrl && <AvatarImage src={selectedConv.otherUser.avatarUrl} alt={selectedConv.otherUser.displayName || selectedConv.otherUser.username} className="object-cover" />}
                          <AvatarFallback className="bg-primary/10 text-lg font-black text-primary">{(selectedConv.otherUser?.displayName || selectedConv.otherUser?.username || "ND").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="mt-4 text-lg font-black text-foreground">{conversationDisplayName || selectedConv.otherUser?.displayName || selectedConv.otherUser?.username}</p>
                        <p className="mt-1 max-w-xs text-sm font-medium text-muted-foreground">Bắt đầu cuộc trò chuyện bằng tin nhắn, ảnh, voice hoặc cuộc gọi.</p>
                      </div>
                    ) : (
                      messageItems.map((item) => {
                        if (item.type === "image-group") {
                          const firstMessage = item.messages[0]
                          const lastMessage = item.messages[item.messages.length - 1]
                          const mine = item.sender?.id === currentUser.id
                          const otherName = selectedConv.otherUser?.displayName || selectedConv.otherUser?.username || "ND"
                          const visibleMedia = item.media.slice(0, 4)
                          const extraCount = item.media.length - visibleMedia.length
                          const groupMenuId = `group-${item.id}`
                          return (
                            <div
                              key={item.id}
                              ref={(node) => {
                                item.messages.forEach((message) => {
                                  if (node) messageRefs.current.set(message.id, node)
                                  else messageRefs.current.delete(message.id)
                                })
                              }}
                              className={`group flex items-end gap-2 rounded-2xl transition-shadow ${mine ? "justify-end" : "justify-start"}`}
                            >
                              {!mine && (
                                <Avatar className="h-7 w-7 shrink-0">
                                  {selectedConv.otherUser?.avatarUrl && <AvatarImage src={selectedConv.otherUser.avatarUrl} alt={otherName} className="object-cover" />}
                                  <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">{otherName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`flex items-center gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
                                  <div className={`max-w-[min(76vw,360px)] rounded-[1.35rem] p-1 shadow-sm md:max-w-[420px] ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground"}`}>
                                  {firstMessage.isPinned && (
                                    <div className={`flex items-center gap-1 px-2 pb-1 pt-0.5 text-[10px] font-bold ${mine ? "text-primary-foreground/80" : "text-primary"}`}>
                                      <Pin className="h-3 w-3" />
                                      Đã ghim
                                    </div>
                                  )}
                                  <div className={`grid overflow-hidden rounded-[1.1rem] ${visibleMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-1`}>
                                    {visibleMedia.map((media, index) => (
                                      <button
                                        key={`${media.url}-${index}`}
                                        type="button"
                                        onClick={() => openImageViewer(media)}
                                        className={`group/image relative block overflow-hidden bg-background/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${visibleMedia.length === 3 && index === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"}`}
                                      >
                                        <img src={media.url} alt={media.label || "Ảnh trong tin nhắn"} draggable={false} className="h-full w-full object-cover transition duration-200 group-hover/image:scale-[1.015]" />
                                        {extraCount > 0 && index === visibleMedia.length - 1 && (
                                          <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xl font-black text-white">
                                            +{extraCount}
                                          </span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                  <div className={`mt-1 flex items-center gap-1 px-1 text-[10px] ${mine ? "justify-end text-primary-foreground/70" : "text-muted-foreground"}`}>
                                    <span>{item.media.length} ảnh</span>
                                    <span>·</span>
                                    <span>{formatTimeAgo(lastMessage.createdAt)}</span>
                                    {mine && lastMessage.isRead && <CheckCheck className="h-3 w-3" />}
                                  </div>
                                </div>
                                <div className="relative shrink-0 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => setOpenMessageMenuId((id) => id === groupMenuId ? null : groupMenuId)}
                                    className="kinetic flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border/70 hover:text-primary"
                                    aria-label="Tùy chọn cụm ảnh"
                                    aria-expanded={openMessageMenuId === groupMenuId}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                  {openMessageMenuId === groupMenuId && (
                                    <div className={`absolute bottom-full z-30 mb-2 w-40 overflow-hidden rounded-2xl border border-border/70 bg-popover p-1 text-sm shadow-xl ${mine ? "right-0" : "left-0"}`}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReplyingTo({
                                            id: firstMessage.id,
                                            senderName: firstMessage.sender?.displayName || firstMessage.sender?.username || "Người dùng",
                                            preview: `${item.media.length} ảnh`,
                                          })
                                          setOpenMessageMenuId(null)
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-foreground hover:bg-muted"
                                      >
                                        <Reply className="h-4 w-4 text-primary" />
                                        Trả lời
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          togglePinMessage(firstMessage)
                                          setOpenMessageMenuId(null)
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-foreground hover:bg-muted"
                                      >
                                        <Pin className="h-4 w-4 text-primary" />
                                        {firstMessage.isPinned ? "Bỏ ghim" : "Ghim cụm"}
                                      </button>
                                      {mine && (
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            for (const message of item.messages) await recallMessage(message)
                                            setOpenMessageMenuId(null)
                                          }}
                                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-destructive hover:bg-destructive/10"
                                        >
                                          <RotateCcw className="h-4 w-4" />
                                          Thu hồi cụm
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        }
                        const message = item.message
                        const mine = message.sender?.id === currentUser.id
                        const replyPayload = decodeReplyMessage(message.content)
                        const messageContent = unwrapMessageContent(message.content)
                        const recalled = messageContent === MESSAGE_RECALLED
                        const media = recalled ? null : decodeMediaMessage(messageContent)
                        const otherName = selectedConv.otherUser?.displayName || selectedConv.otherUser?.username || "ND"
                        return (
                          <div
                            key={message.id}
                            ref={(node) => {
                              if (node) messageRefs.current.set(message.id, node)
                              else messageRefs.current.delete(message.id)
                            }}
                            className={`group flex items-end gap-2 rounded-2xl transition-shadow ${mine ? "justify-end" : "justify-start"}`}
                          >
                            {!mine && (
                              <Avatar className="h-7 w-7 shrink-0">
                                {selectedConv.otherUser?.avatarUrl && <AvatarImage src={selectedConv.otherUser.avatarUrl} alt={otherName} className="object-cover" />}
                                <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">{otherName.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`flex items-center gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
                              <div className={`${media?.kind === "image" ? "max-w-[min(76vw,320px)] p-1" : media?.kind === "audio" ? "w-[min(76vw,260px)] overflow-hidden p-1" : media?.kind === "sticker" ? "max-w-[68vw] px-2 py-1.5" : "max-w-[min(72vw,420px)] px-3 py-2"} rounded-[1.35rem] text-sm leading-5 shadow-sm md:max-w-[62%] ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground"}`}>
                                {message.isPinned && (
                                  <div className={`mb-1 flex items-center gap-1 text-[10px] font-bold ${mine ? "text-primary-foreground/80" : "text-primary"}`}>
                                    <Pin className="h-3 w-3" />
                                    Đã ghim
                                  </div>
                                )}
                                {replyPayload?.replyTo && (
                                  <div className={`mb-1.5 rounded-2xl border-l-2 px-2 py-1 text-xs ${mine ? "border-primary-foreground/55 bg-white/15 text-primary-foreground/85" : "border-primary/55 bg-background/60 text-muted-foreground"}`}>
                                    <p className="font-bold">{replyPayload.replyTo.senderName}</p>
                                    <p className="line-clamp-2 break-words">{replyPayload.replyTo.preview}</p>
                                  </div>
                                )}
                                {recalled ? (
                                  <p className={`italic ${mine ? "text-primary-foreground/75" : "text-muted-foreground"}`}>Tin nhắn đã được thu hồi</p>
                                ) : media?.kind === "image" ? (
                                  <button type="button" onClick={() => openImageViewer(media)} className="group/image block overflow-hidden rounded-[1.1rem] bg-background/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                    <img src={media.url} alt={media.label || "Ảnh trong tin nhắn"} draggable={false} className="max-h-64 w-full rounded-[1.1rem] object-contain transition duration-200 group-hover/image:scale-[1.015]" />
                                  </button>
                                ) : media?.kind === "audio" ? (
                                  <VoiceMessagePlayer src={media.url} mine={mine} />
                                ) : media?.kind === "sticker" ? (
                                  <p className="text-4xl leading-none">{media.label}</p>
                                ) : media?.kind === "gif" ? (
                                  <p className={`rounded-xl px-3 py-2 text-sm font-bold ${mine ? "bg-white/15 text-white" : "bg-primary/10 text-primary"}`}>{media.label}</p>
                                ) : (
                                  <p className="whitespace-pre-wrap break-words">{messageContent}</p>
                                )}
                                <div className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "justify-end text-primary-foreground/70" : "text-muted-foreground"}`}>
                                  <span>{formatTimeAgo(message.createdAt)}</span>
                                  {mine && message.isRead && <CheckCheck className="h-3 w-3" />}
                                </div>
                              </div>
                              {!recalled && (
                                <div className="relative shrink-0 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => setOpenMessageMenuId((id) => id === message.id ? null : message.id)}
                                    className="kinetic flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border/70 hover:text-primary"
                                    aria-label="Tùy chọn tin nhắn"
                                    aria-expanded={openMessageMenuId === message.id}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                  {openMessageMenuId === message.id && (
                                    <div className={`absolute bottom-full z-30 mb-2 w-44 overflow-hidden rounded-2xl border border-border/70 bg-popover p-1 text-sm shadow-xl ${mine ? "right-0" : "left-0"}`}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReplyingTo(buildReplyTarget(message))
                                          setOpenMessageMenuId(null)
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-foreground hover:bg-muted"
                                      >
                                        <Reply className="h-4 w-4 text-primary" />
                                        Trả lời
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          togglePinMessage(message)
                                          setOpenMessageMenuId(null)
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-foreground hover:bg-muted"
                                      >
                                        <Pin className="h-4 w-4 text-primary" />
                                        {message.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          copyMessageValue(message)
                                          setOpenMessageMenuId(null)
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-foreground hover:bg-muted"
                                      >
                                        <Copy className="h-4 w-4 text-primary" />
                                        {media?.url ? "Sao chép link" : "Sao chép"}
                                      </button>
                                      {media?.kind === "image" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            openImageViewer(media)
                                            setOpenMessageMenuId(null)
                                          }}
                                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-foreground hover:bg-muted"
                                        >
                                          <ImageIcon className="h-4 w-4 text-primary" />
                                          Xem ảnh
                                        </button>
                                      )}
                                      {media?.url && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            window.open(media.url, "_blank", "noopener,noreferrer")
                                            setOpenMessageMenuId(null)
                                          }}
                                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-foreground hover:bg-muted"
                                        >
                                          <ExternalLink className="h-4 w-4 text-primary" />
                                          Mở file
                                        </button>
                                      )}
                                      {mine && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            recallMessage(message)
                                            setOpenMessageMenuId(null)
                                          }}
                                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-destructive hover:bg-destructive/10"
                                        >
                                          <RotateCcw className="h-4 w-4" />
                                          Thu hồi
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                    {typingLabel && (
                      <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground">
                        <div className="flex h-7 items-center gap-1 rounded-full bg-muted px-3">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:300ms]" />
                        </div>
                        <span className="font-medium">{typingLabel}</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {(error || callError) && <p role="alert" className="relative z-10 border-t border-border/60 bg-destructive/10 px-4 py-2 text-xs text-destructive">{callError || error}</p>}

                  {replyingTo && (
                    <div className="relative z-10 flex shrink-0 items-center gap-3 border-t border-border/60 bg-card/95 px-3 py-2">
                      <div className="min-w-0 flex-1 border-l-2 border-primary pl-3">
                        <p className="text-xs font-bold text-primary">Đang trả lời {replyingTo.senderName}</p>
                        <p className="truncate text-sm text-muted-foreground">{replyingTo.preview}</p>
                      </div>
                      <button type="button" onClick={() => setReplyingTo(null)} className="kinetic flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Hủy trả lời">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {pendingImages.length > 0 && (
                    <div className="relative z-10 flex shrink-0 items-center gap-3 border-t border-border/60 bg-card/95 px-3 py-2">
                      <div className="custom-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                        {pendingImages.map((image) => (
                          <div key={image.id} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                            <img src={image.url} alt={image.name} draggable={false} className="h-full w-full object-cover" />
                            <button type="button" onClick={() => removePendingImage(image.id)} disabled={sending} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-50" aria-label="Xóa ảnh khỏi danh sách gửi">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="hidden min-w-0 flex-1 sm:block">
                        <p className="truncate text-sm font-bold text-foreground">{pendingImages.length} ảnh đã chọn</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(pendingImages.reduce((sum, image) => sum + image.size, 0))} · Xem lại trước khi gửi</p>
                      </div>
                      <button type="button" onClick={clearPendingImages} disabled={sending} className="kinetic flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-50" aria-label="Hủy ảnh">
                        <X className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={sendPendingImages} disabled={sending} className="kinetic flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" aria-label="Gửi ảnh">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  )}

                  <form onSubmit={sendMessage} className="relative z-10 flex shrink-0 items-center gap-1.5 border-t border-border/60 bg-card/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:gap-2 sm:px-3">
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
                      multiple
                      className="hidden"
                      onChange={(event) => selectImageFiles(event.target.files)}
                    />
                    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                      <button type="button" onClick={toggleRecording} aria-label={recording ? "Dừng ghi âm" : "Ghi âm"} className={`kinetic flex h-9 w-9 items-center justify-center rounded-full ${recording ? "bg-destructive/10 text-destructive" : "text-primary hover:bg-primary/10"}`}>
                        <Mic className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => imageInputRef.current?.click()} aria-label="Thêm ảnh" className="kinetic flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10">
                        <ImagePlus className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setActivePicker((picker) => picker === "sticker" ? null : "sticker")} aria-label="Sticker" className="kinetic hidden h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10 min-[380px]:flex">
                        <Sticker className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setActivePicker((picker) => picker === "gif" ? null : "gif")} aria-label="GIF" className="kinetic hidden h-9 min-w-9 items-center justify-center rounded-full px-2 text-[10px] font-black text-primary hover:bg-primary/10 sm:flex">
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
                      <button type="button" onClick={() => setActivePicker((picker) => picker === "emoji" ? null : "emoji")} aria-label="Biểu cảm" className="kinetic flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10">
                        <Smile className="h-4 w-4" />
                      </button>
                    </div>

                    {inputText.trim() || pendingImages.length > 0 ? (
                      <button type="submit" disabled={sending} className="kinetic flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10 disabled:opacity-45" aria-label="Gửi tin nhắn">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    ) : (
                      <button type="button" onClick={sendQuickLike} disabled={sending || !selectedConvId} className="kinetic flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10 disabled:opacity-45" aria-label="Gửi lượt thích">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-xl leading-none">{currentSettings.quickEmoji || "👍"}</span>}
                      </button>
                    )}
                  </form>
                </>
              ) : (
                <div className="hidden h-full flex-col items-center justify-center bg-background/35 text-center text-muted-foreground md:flex">
                  <MessageCircle className="h-12 w-12 text-primary/50" />
                  <p className="mt-4 text-sm font-semibold text-foreground">Chọn một cuộc trò chuyện</p>
                  <p className="mt-1 text-xs">Tin nhắn sẽ hiển thị tại đây.</p>
                </div>
              )}
            </section>
            {showConversationInfo && selectedConv && (
              <div className="hidden min-h-0 xl:block">
                {renderConversationInfo()}
              </div>
            )}
          </div>
        </section>
      </div>

      {showConversationInfo && selectedConv && (
        <div className="fixed inset-0 z-[88] bg-black/35 backdrop-blur-sm xl:hidden" role="dialog" aria-modal="true" aria-label="Thông tin đoạn chat">
          <div className="ml-auto h-full w-full max-w-sm">
            {renderConversationInfo()}
          </div>
        </div>
      )}

      {incomingCall && !callState && (
        <div className="fixed inset-0 z-[94] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Cuộc gọi đến">
          <section className="w-full max-w-sm rounded-3xl border border-border/70 bg-card p-5 text-center shadow-2xl">
            <Avatar className="mx-auto h-20 w-20 ring-4 ring-primary/15">
              {incomingCall.caller?.avatarUrl && <AvatarImage src={incomingCall.caller.avatarUrl} alt={incomingCall.caller.displayName || incomingCall.caller.username} className="object-cover" />}
              <AvatarFallback className="bg-primary text-xl font-black text-primary-foreground">{(incomingCall.caller?.displayName || incomingCall.caller?.username || "ND").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="mt-4 text-lg font-black">{incomingCall.caller?.displayName || incomingCall.caller?.username || "Người dùng"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{incomingCall.mode === "video" ? "Đang gọi video..." : "Đang gọi thoại..."}</p>
            <div className="mt-5 flex items-start justify-center gap-8">
              <button type="button" onClick={declineIncomingCall} disabled={incomingActionLoading} className="kinetic flex flex-col items-center gap-2 text-xs font-bold text-muted-foreground disabled:opacity-50" aria-label="Từ chối cuộc gọi">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600">
                  <PhoneOff className="h-6 w-6" />
                </span>
                <span>Từ chối</span>
              </button>
              <button type="button" onClick={acceptIncomingCall} disabled={incomingActionLoading} className="kinetic flex flex-col items-center gap-2 text-xs font-bold text-muted-foreground disabled:opacity-50" aria-label="Nhận cuộc gọi">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600">
                  {incomingActionLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : incomingCall.mode === "video" ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
                </span>
                <span>Nhận</span>
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
                  <div
                    ref={callPreviewRef}
                    className={`fixed z-10 h-32 w-24 touch-none select-none overflow-hidden rounded-2xl border border-white/20 bg-slate-950 shadow-2xl sm:h-44 sm:w-32 ${callPreviewPosition ? "" : "bottom-24 right-4 sm:bottom-28 sm:right-6"}`}
                    style={callPreviewPosition ? { left: callPreviewPosition.x, top: callPreviewPosition.y } : undefined}
                    onPointerDown={startCallPreviewDrag}
                    onPointerMove={moveCallPreview}
                    onPointerUp={stopCallPreviewDrag}
                    onPointerCancel={stopCallPreviewDrag}
                    role="presentation"
                  >
                    <video ref={callVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  </div>
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
              <button type="button" onClick={resetImageView} className="kinetic flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Đặt lại kích thước ảnh">
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
          <div
            className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) setImageViewer(null)
            }}
            onWheel={handleImageWheel}
          >
            <img
              src={imageViewer.url}
              alt={imageViewer.label || "Ảnh trong tin nhắn"}
              draggable={false}
              className="max-h-full max-w-full select-none rounded-xl object-contain shadow-2xl will-change-transform"
              style={{
                cursor: imageZoom > 1 ? (imageDragging ? "grabbing" : "grab") : "zoom-in",
                touchAction: imageZoom > 1 ? "none" : "manipulation",
                transform: `translate3d(${imagePan.x}px, ${imagePan.y}px, 0) scale(${imageZoom})`,
                transformOrigin: "center center",
                transition: imageDragging ? "none" : "transform 160ms ease-out",
              }}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={handleImageDoubleClick}
              onPointerCancel={handleImagePointerUp}
              onPointerDown={handleImagePointerDown}
              onPointerMove={handleImagePointerMove}
              onPointerUp={handleImagePointerUp}
            />
          </div>
        </div>
      )}
    </main>
  )
}
