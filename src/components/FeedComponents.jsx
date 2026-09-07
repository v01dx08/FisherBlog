"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  BookmarkSimple,
  Certificate,
  ChatCircle,
  DotsThree,
  Fish,
  GlobeHemisphereWest,
  ImageSquare,
  LinkSimple,
  MapPin,
  PaperPlaneTilt,
  ShareNetwork,
  ShieldCheck,
  Trash,
  UploadSimple,
  VideoCamera,
  WarningCircle,
  X,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MediaGrid } from "@/components/MediaGrid"

function formatTimeAgo(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Vừa xong"
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (minutes < 1) return "Vừa xong"
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return date.toLocaleDateString("vi-VN")
}

function renderContent(text) {
  return String(text || "")
    .split(/(#[a-zA-Z0-9_\u00C0-\u1EF9]+)/g)
    .map((part, index) =>
      part.startsWith("#") ? (
        <Link key={`${part}-${index}`} href={`/?tag=${encodeURIComponent(part.slice(1))}`} className="font-semibold text-primary hover:underline">
          {part}
        </Link>
      ) : (
        part
      )
    )
}

async function uploadFile(file) {
  const form = new FormData()
  form.set("file", file)
  const response = await fetch("/api/uploads", { method: "POST", body: form })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Không thể tải tệp lên")
  return data.url
}

function previewGridClass(count) {
  if (count <= 1) return "grid-cols-1 aspect-[4/3] sm:aspect-[16/10]"
  if (count === 2) return "grid-cols-2 aspect-[16/10]"
  if (count === 3) return "grid-cols-2 grid-rows-2 aspect-[4/3] sm:aspect-[16/10]"
  if (count === 4) return "grid-cols-2 grid-rows-2 aspect-[4/3]"
  return "grid-cols-6 grid-rows-[minmax(0,1.2fr)_minmax(0,1fr)] aspect-[5/4] sm:aspect-[4/3]"
}

function previewTileClass(count, index) {
  if (count === 3 && index === 0) return "col-span-2"
  if (count >= 5 && index < 2) return "col-span-3"
  if (count >= 5) return "col-span-2"
  return ""
}

export function CreatePostBox({
  onPostCreated,
  currentUser,
  startExpanded = false,
  hideTrigger = false,
  onRequestCompose,
  onCancel,
}) {
  const fileRef = React.useRef(null)
  const [expanded, setExpanded] = React.useState(startExpanded)
  const [content, setContent] = React.useState("")
  const [files, setFiles] = React.useState([])
  const [species, setSpecies] = React.useState("")
  const [weightKg, setWeightKg] = React.useState("")
  const [spotName, setSpotName] = React.useState("")
  const [visibility, setVisibility] = React.useState("PUBLIC")
  const [submitting, setSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const previews = React.useMemo(
    () => files.map((item) => ({ file: item, url: URL.createObjectURL(item) })),
    [files]
  )
  React.useEffect(() => () => { previews.forEach((item) => URL.revokeObjectURL(item.url)) }, [previews])

  const reset = () => {
    setContent("")
    setFiles([])
    setSpecies("")
    setWeightKg("")
    setSpotName("")
    setVisibility("PUBLIC")
    setExpanded(false)
    setErrorMessage("")
    if (fileRef.current) fileRef.current.value = ""
  }

  const cancel = () => {
    reset()
    onCancel?.()
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!currentUser) {
      setErrorMessage("Đăng nhập để xuất bản nhật ký.")
      return
    }
    if (content.trim().length < 3) {
      setErrorMessage("Nội dung cần ít nhất 3 ký tự.")
      return
    }

    setSubmitting(true)
    setErrorMessage("")
    try {
      const uploadedItems = files.length
        ? await Promise.all(files.map(async (item) => ({
            file: item,
            url: new URL(await uploadFile(item), window.location.origin).toString(),
          })))
        : []
      const videoItem = uploadedItems.find((item) => item.file.type.startsWith("video/"))
      const imageUrls = uploadedItems
        .filter((item) => item.file.type.startsWith("image/"))
        .map((item) => item.url)
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          imageUrls,
          videoUrl: videoItem?.url || null,
          species,
          weightKg,
          spotName,
          visibility,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể đăng nhật ký")
      onPostCreated?.(data)
      reset()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectFiles = (selectedFiles) => {
    const selected = Array.from(selectedFiles || [])
    if (selected.length === 0) return
    const hasVideo = selected.some((item) => item.type.startsWith("video/"))
    const hasImage = selected.some((item) => item.type.startsWith("image/"))
    if (hasVideo && (hasImage || selected.length > 1)) {
      setErrorMessage("Chỉ chọn một video, hoặc chọn nhiều ảnh trong cùng một bài.")
      if (fileRef.current) fileRef.current.value = ""
      return
    }
    const nextFiles = hasVideo ? selected.slice(0, 1) : selected.slice(0, 10)
    setFiles(nextFiles)
    setErrorMessage(selected.length > nextFiles.length ? "Tối đa 10 ảnh cho mỗi bài viết." : "")
  }

  const initials = (currentUser?.displayName || currentUser?.username || "NK").slice(0, 2).toUpperCase()

  return (
    <div className="social-card mb-4 overflow-hidden" id="composer">
      <form onSubmit={submit} className="p-4 sm:p-5">
        {!hideTrigger && (
        <div className="flex gap-3">
          <Avatar className="h-11 w-11 ring-1 ring-primary/20">
            {currentUser?.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt={currentUser.displayName || currentUser.username} className="object-cover" />}
            <AvatarFallback className="bg-primary font-semibold text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => onRequestCompose ? onRequestCompose() : setExpanded(true)}
            className="kinetic min-h-11 flex-1 rounded-full bg-muted/75 px-4 text-left text-sm text-muted-foreground ring-1 ring-transparent hover:bg-muted hover:ring-border"
          >
            {currentUser ? "Ghi lại mẻ câu, kỹ thuật và khoảnh khắc hôm nay..." : "Đăng nhập để lưu dấu thời gian cho nội dung gốc..."}
          </button>
        </div>
        )}

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className={hideTrigger ? "space-y-4" : "mt-4 space-y-4 border-t border-border/65 pt-4"}
            >
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                  multiple
                  className="hidden"
                  onChange={(event) => selectFiles(event.target.files)}
                />
                <button type="button" onClick={() => fileRef.current?.click()} className="kinetic flex min-w-0 items-center gap-2 rounded-xl bg-muted/55 px-4 py-3 text-left text-xs font-semibold text-muted-foreground ring-1 ring-border/60 hover:bg-muted hover:text-foreground">
                  {files[0]?.type.startsWith("video/") ? <VideoCamera size={17} weight="light" className="shrink-0" /> : <ImageSquare size={17} weight="light" className="shrink-0" />}
                  <span className="min-w-0 truncate">
                    {files.length > 1 ? `${files.length} ảnh đã chọn` : files[0]?.name || "Tải ảnh hoặc video"}
                  </span>
                </button>
                <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="min-w-0 rounded-xl bg-muted/55 px-4 py-3 text-xs font-semibold outline-none ring-1 ring-border/60">
                  <option value="PUBLIC">Công khai</option>
                  <option value="UNLISTED">Chỉ người có link</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </div>

              {previews.length > 0 && (
                <div className={`grid min-w-0 max-w-full gap-0.5 overflow-hidden rounded-xl bg-muted/40 ${previewGridClass(previews.length)}`}>
                  {previews.slice(0, 5).map((preview, index) => (
                    <div key={preview.url} className={`relative min-h-0 min-w-0 overflow-hidden bg-foreground ${previewTileClass(previews.length, index)}`}>
                      {preview.file.type.startsWith("video/") ? (
                        <video src={preview.url} controls className="h-full w-full object-contain" />
                      ) : (
                        <img src={preview.url} alt="Xem trước ảnh tải lên" className="h-full w-full object-cover" />
                      )}
                      {previews.length > 5 && index === 4 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/65 text-3xl font-bold text-white">
                          +{previews.length - 5}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setFiles((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                        aria-label="Bỏ tệp"
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white"
                      >
                        <X size={15} weight="light" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                autoFocus
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={3000}
                placeholder="Kể câu chuyện mẻ câu. Thêm hashtag để cộng đồng dễ tìm thấy."
                className="min-h-32 w-full resize-none rounded-xl bg-muted/55 p-4 text-sm leading-relaxed outline-none ring-1 ring-border/65 focus:ring-primary/50"
              />

              <div className="grid min-w-0 grid-cols-3 gap-3">
                <label className="min-w-0 rounded-xl bg-muted/55 px-3 py-3 ring-1 ring-border/60 sm:px-4">
                  <span className="mb-1 block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:tracking-[0.16em]">Loài cá</span>
                  <input value={species} onChange={(event) => setSpecies(event.target.value)} maxLength={80} placeholder="Cá chẽm" className="w-full min-w-0 bg-transparent text-sm outline-none" />
                </label>
                <label className="min-w-0 rounded-xl bg-muted/55 px-3 py-3 ring-1 ring-border/60 sm:px-4">
                  <span className="mb-1 block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:tracking-[0.16em]">Cân nặng</span>
                  <input type="number" min="0.01" max="1000" step="0.01" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} placeholder="3.2 kg" className="w-full min-w-0 bg-transparent text-sm outline-none" />
                </label>
                <label className="min-w-0 rounded-xl bg-muted/55 px-3 py-3 ring-1 ring-border/60 sm:px-4">
                  <span className="mb-1 block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:tracking-[0.16em]">Điểm câu</span>
                  <input value={spotName} onChange={(event) => setSpotName(event.target.value)} maxLength={120} placeholder="Hồ Trị An" className="w-full min-w-0 bg-transparent text-sm outline-none" />
                </label>
              </div>

              {errorMessage && (
                <div role="alert" className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-xs text-destructive">
                  <WarningCircle size={16} weight="light" /> {errorMessage}
                  {!currentUser && <Link href="/login" className="ml-auto font-semibold underline">Đăng nhập</Link>}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
                <button type="button" onClick={cancel} disabled={submitting} className="kinetic rounded-lg px-4 py-2.5 text-xs font-semibold hover:bg-muted">Hủy</button>
                <button type="submit" disabled={submitting || !content.trim()} className="kinetic group flex items-center gap-2 rounded-lg bg-primary py-1 pl-4 pr-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 active:scale-[0.98]">
                  {submitting ? "Đang xuất bản..." : "Xuất bản"}
                  <span className="kinetic flex h-8 w-8 items-center justify-center rounded-full bg-white/14 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    <UploadSimple size={15} weight="light" />
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  )
}

export function PostCard({
  postId,
  author,
  time,
  content,
  image,
  videoUrl,
  species,
  weightKg,
  spotName,
  proofHash,
  proofIssuedAt,
  initialLikes = 0,
  initialIsLiked = false,
  initialIsBookmarked = false,
  initialComments = [],
  currentUser,
  onPostDeleted,
}) {
  const router = useRouter()
  const [liked, setLiked] = React.useState(initialIsLiked)
  const [likeCount, setLikeCount] = React.useState(initialLikes)
  const [bookmarked, setBookmarked] = React.useState(initialIsBookmarked)
  const [comments, setComments] = React.useState(initialComments)
  const [commentsOpen, setCommentsOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [comment, setComment] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [actionError, setActionError] = React.useState("")
  const [deleteArmed, setDeleteArmed] = React.useState(false)

  const authorObject = typeof author === "object" ? author : { username: author }
  const authorName = authorObject.displayName || authorObject.username || "Cần thủ"
  const authorUsername = authorObject.username || "user"
  const initials = authorName.slice(0, 2).toUpperCase()
  const canDelete = currentUser && (currentUser.id === authorObject.id || currentUser.role === "ADMIN")
  const media = React.useMemo(() => {
    const items = []
    if (videoUrl) items.push({ type: "video", url: videoUrl })
    if (image) {
      try {
        const parsed = JSON.parse(image)
        if (Array.isArray(parsed)) parsed.forEach((url) => items.push({ type: "image", url }))
        else items.push({ type: "image", url: image })
      } catch {
        items.push({ type: "image", url: image })
      }
    }
    return items
  }, [image, videoUrl])

  const toggleLike = async () => {
    if (!currentUser) return router.push("/login")
    const previousLiked = liked
    const previousCount = likeCount
    setLiked(!liked)
    setLikeCount(liked ? Math.max(0, likeCount - 1) : likeCount + 1)
    setActionError("")
    try {
      const response = await fetch(`/api/posts/${postId}/like`, { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể cập nhật lượt thích")
      setLiked(data.liked)
      setLikeCount(data.likeCount)
    } catch (caught) {
      setLiked(previousLiked)
      setLikeCount(previousCount)
      setActionError(caught.message)
    }
  }

  const toggleBookmark = async () => {
    if (!currentUser) return router.push("/login")
    const previous = bookmarked
    setBookmarked(!bookmarked)
    setActionError("")
    try {
      const response = await fetch(`/api/posts/${postId}/bookmark`, { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể lưu bài viết")
      setBookmarked(data.bookmarked)
    } catch (caught) {
      setBookmarked(previous)
      setActionError(caught.message)
    }
  }

  const addComment = async (event) => {
    event.preventDefault()
    if (!comment.trim() || submitting) return
    setSubmitting(true)
    setActionError("")
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setComments((items) => [...items, data])
      setComment("")
    } catch (error) {
      setActionError(error.message || "Không thể gửi bình luận")
    } finally {
      setSubmitting(false)
    }
  }

  const share = async () => {
    const url = `${window.location.origin}/post/${postId}`
    try {
      if (navigator.share) await navigator.share({ title: authorName, text: content.slice(0, 120), url })
      else await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (caught) {
      if (caught?.name !== "AbortError") setActionError("Không thể chia sẻ bài viết")
    }
  }

  const remove = async () => {
    if (!deleteArmed) {
      setDeleteArmed(true)
      return
    }
    setActionError("")
    const response = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
    const data = await response.json().catch(() => ({}))
    if (response.ok) onPostDeleted?.(postId)
    else setActionError(data.error || "Không thể xóa nhật ký")
  }

  return (
    <motion.article
      layout
      className="feed-card-shell social-card mb-4 overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.48, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="overflow-hidden">
        <header className="flex items-start justify-between gap-3 p-4 sm:p-5">
          <Link href={`/profile/${authorUsername}`} className="group flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11 ring-1 ring-primary/20">
              {authorObject.avatarUrl && <AvatarImage src={authorObject.avatarUrl} alt={authorName} className="object-cover" />}
              <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold group-hover:text-primary">{authorName}</span>
                <ShieldCheck size={15} weight="light" className="shrink-0 text-primary" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>{formatTimeAgo(time)}</span>
                <span>·</span>
                <GlobeHemisphereWest size={13} weight="light" />
              </div>
            </div>
          </Link>
          <div className="relative flex items-center">
            <button type="button" onClick={toggleBookmark} aria-label={bookmarked ? "Bỏ lưu" : "Lưu bài viết"} className={`kinetic flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted ${bookmarked ? "text-primary" : "text-muted-foreground"}`}>
              <BookmarkSimple size={18} weight={bookmarked ? "fill" : "light"} />
            </button>
            {canDelete && (
              <>
                <button type="button" onClick={() => { setMenuOpen((open) => !open); setDeleteArmed(false) }} aria-label="Tùy chọn bài viết" aria-expanded={menuOpen} className="kinetic flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
                  <DotsThree size={20} weight="bold" />
                </button>
                {menuOpen && (
                  <button type="button" onClick={remove} className="absolute right-0 top-11 z-10 flex w-40 items-center gap-2 rounded-2xl bg-popover px-4 py-3 text-xs font-semibold text-destructive ring-1 ring-foreground/10 shadow-xl">
                    <Trash size={16} weight="light" /> {deleteArmed ? "Xác nhận xóa" : "Xóa nhật ký"}
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        <div className="px-4 pb-4 sm:px-5">
          <p className="whitespace-pre-wrap text-[15px] leading-7">{renderContent(content)}</p>
          {(species || weightKg || spotName) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {species && <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"><Fish size={14} weight="light" />{species}</span>}
              {weightKg && <span className="rounded-full bg-accent/25 px-3 py-1.5 text-xs font-semibold">{weightKg} kg</span>}
              {spotName && <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground"><MapPin size={14} weight="light" />{spotName}</span>}
            </div>
          )}
        </div>

        {media.length > 0 && <MediaGrid items={media} />}

        <div className="mx-4 flex items-center justify-between border-b border-border/60 py-3 text-xs text-muted-foreground sm:mx-5">
          <button type="button" onClick={toggleLike} className="hover:text-foreground">{likeCount} lượt thích</button>
          <button type="button" onClick={() => setCommentsOpen((open) => !open)} className="hover:text-foreground">{comments.length} bình luận</button>
        </div>

        <div className="grid grid-cols-4 gap-1 px-3 py-2 sm:px-4">
          <button type="button" onClick={toggleLike} aria-pressed={liked} className={`kinetic flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold hover:bg-muted ${liked ? "text-primary" : "text-muted-foreground"}`}>
            <Fish size={18} weight={liked ? "fill" : "regular"} /> Thích
          </button>
          <button type="button" onClick={() => setCommentsOpen((open) => !open)} className="kinetic flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted">
            <ChatCircle size={18} weight="light" /> Bình luận
          </button>
          <button type="button" onClick={share} className="kinetic flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted">
            <ShareNetwork size={18} weight="light" /> {copied ? "Đã chép" : "Chia sẻ"}
          </button>
          <Link href={`/post/${postId}`} className="kinetic flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-primary hover:bg-primary/10">
            <Certificate size={18} weight="light" /> Chứng nhận
          </Link>
        </div>

        {actionError && <p role="alert" className="mx-4 mb-3 rounded-xl bg-destructive/10 px-4 py-3 text-xs text-destructive sm:mx-5">{actionError}</p>}

        <AnimatePresence initial={false}>
          {commentsOpen && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }} className="border-t border-border/60 bg-muted/25 p-5 sm:p-6">
              {currentUser ? (
                <form onSubmit={addComment} className="mb-4 flex gap-2">
                  <input value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder="Trao đổi kinh nghiệm..." className="h-10 flex-1 rounded-full bg-card px-4 text-xs outline-none ring-1 ring-border/70" />
                  <button type="submit" disabled={!comment.trim() || submitting} aria-label="Gửi bình luận" className="kinetic flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
                    <PaperPlaneTilt size={16} weight="light" />
                  </button>
                </form>
              ) : (
                <Link href="/login" className="mb-4 flex items-center justify-center gap-2 rounded-full bg-card px-4 py-3 text-xs font-semibold text-primary ring-1 ring-border/70">
                  <LinkSimple size={15} weight="light" /> Đăng nhập để bình luận
                </Link>
              )}
              <div className="max-h-72 space-y-3 overflow-y-auto custom-scrollbar">
                {comments.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">Chưa có bình luận.</p>
                ) : comments.map((item) => {
                  const name = item.author?.displayName || item.author?.username || "Cần thủ"
                  return (
                    <div key={item.id} className="flex gap-2.5">
                      <Avatar className="h-8 w-8">{item.author?.avatarUrl && <AvatarImage src={item.author.avatarUrl} alt={name} className="object-cover" />}<AvatarFallback className="bg-secondary text-[10px] font-semibold">{name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                      <div className="flex-1 rounded-xl bg-card px-4 py-3 ring-1 ring-border/60">
                        <div className="flex justify-between gap-2">
                          <span className="text-xs font-semibold">{name}</span>
                          <span className="text-[10px] text-muted-foreground">{formatTimeAgo(item.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5">{item.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {proofHash && (
          <footer className="flex items-center gap-2 border-t border-border/50 px-5 py-3 font-mono text-[9px] text-muted-foreground sm:px-6">
            <Certificate size={13} weight="light" className="text-primary" />
            <span>Dấu thời gian {new Date(proofIssuedAt || time).toLocaleString("vi-VN")}</span>
            <span className="ml-auto max-w-28 truncate">{proofHash}</span>
          </footer>
        )}
      </div>
    </motion.article>
  )
}
