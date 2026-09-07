"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Camera, Fish, Globe, MapPin, Shield, Sparkles, Trash2, Video, X } from "lucide-react"
import { AvatarCropper } from "@/components/AvatarCropper"

export function OnboardingModal({ isOpen, user, onComplete, onClose }) {
  const avatarInputRef = useRef(null)
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || "")
  const [bio, setBio] = useState(user?.bio || "")
  const [location, setLocation] = useState(user?.location || "")
  const [fishingStyle, setFishingStyle] = useState(user?.fishingStyle || "")
  const [youtubeUrl, setYoutubeUrl] = useState(user?.youtubeUrl || "")
  const [tiktokUrl, setTiktokUrl] = useState(user?.tiktokUrl || "")
  const [facebookUrl, setFacebookUrl] = useState(user?.facebookUrl || "")
  const [avatarFile, setAvatarFile] = useState(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [confirmRemoveAvatarOpen, setConfirmRemoveAvatarOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const avatarPreview = useMemo(
    () => avatarFile ? URL.createObjectURL(avatarFile) : removeAvatar ? "" : user?.avatarUrl || "",
    [avatarFile, removeAvatar, user?.avatarUrl]
  )
  useEffect(() => () => {
    if (avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview)
  }, [avatarPreview])

  if (!isOpen) return null

  const closeModal = () => {
    if (submitting) return
    setPendingAvatarFile(null)
    setConfirmRemoveAvatarOpen(false)
    if (avatarInputRef.current) avatarInputRef.current.value = ""
    onClose?.()
  }

  const confirmRemoveAvatar = () => {
    setAvatarFile(null)
    setPendingAvatarFile(null)
    setRemoveAvatar(true)
    setConfirmRemoveAvatarOpen(false)
    if (avatarInputRef.current) avatarInputRef.current.value = ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setSubmitting(true)

    try {
      let avatarUrl = removeAvatar ? null : user?.avatarUrl || null
      if (avatarFile) {
        const form = new FormData()
        form.set("file", avatarFile)
        form.set("purpose", "avatar")
        const uploadResponse = await fetch("/api/uploads", { method: "POST", body: form })
        const uploadData = await uploadResponse.json()
        if (!uploadResponse.ok) throw new Error(uploadData.error || "Không thể tải ảnh đại diện.")
        avatarUrl = new URL(uploadData.url, window.location.origin).toString()
      }

      const res = await fetch(`/api/users/${user.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          avatarUrl,
          bio: bio.trim(),
          location: location.trim(),
          fishingStyle: fishingStyle.trim(),
          youtubeUrl: youtubeUrl.trim(),
          tiktokUrl: tiktokUrl.trim(),
          facebookUrl: facebookUrl.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu thông tin hồ sơ.")
      }

      if (onComplete) {
        onComplete(data)
      }
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: data }))
    } catch (caught) {
      setErrorMsg(caught.message || "Lỗi kết nối máy chủ khi lưu hồ sơ.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-md sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-setup-title"
        onClick={closeModal}
        onKeyDown={(event) => {
          if (event.key === "Escape") closeModal()
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="custom-scrollbar relative max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-border/80 bg-card p-5 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-8"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Dong chinh sua ho so"
            onClick={closeModal}
            disabled={submitting}
            className="kinetic absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 sm:right-5 sm:top-5"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mb-4 flex items-start gap-3 pr-11">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 id="profile-setup-title" className="text-xl font-bold tracking-tight">Thiết lập Trang cá nhân </h2>
              <p className="text-xs text-muted-foreground">
                Hoàn tất thông tin để kích hoạt chứng nhận bảo vệ quyền tác giả
              </p>
            </div>
          </div>

          <div className="mb-6 p-3.5 rounded-2xl bg-primary/5 border border-primary/10 text-xs text-muted-foreground flex items-start gap-2.5">
            <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              Tài khoản của bạn được cấp bởi Ban Quản Trị. Thiết lập liên kết kênh mạng xã hội giúp đối chiếu bản phát hành khi nội dung được đăng tải trước trên Nhật ký ngày đi câu.
            </span>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-muted/35 p-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl font-bold text-primary-foreground ring-4 ring-background shadow-lg">
                {avatarPreview ? <img src={avatarPreview} alt="Xem trước ảnh đại diện" className="h-full w-full object-cover" /> : (displayName || user?.username || "NK").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Ảnh đại diện</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">JPG, PNG, WebP hoặc GIF. Tối đa 5 MB.</p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) || file.size > 5 * 1024 * 1024) {
                      setErrorMsg("Ảnh đại diện phải là JPG, PNG, WebP hoặc GIF và nhỏ hơn 5 MB.")
                      event.target.value = ""
                      return
                    }
                    setErrorMsg("")
                    setPendingAvatarFile(file)
                  }}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} className="rounded-full gap-2">
                    <Camera className="h-4 w-4" /> {avatarPreview ? "Đổi ảnh" : "Chọn ảnh"}
                  </Button>
                  {avatarPreview && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmRemoveAvatarOpen(true)} className="rounded-full gap-2 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" /> Xóa ảnh
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tên hiển thị
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="vd: Minh Đức Fishing"
                  className="h-10 rounded-xl bg-muted/40 border-border/60"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Điểm câu thường xuyên
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="vd: Hồ Trị An, Đồng Nai"
                    className="pl-9 h-10 rounded-xl bg-muted/40 border-border/60"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Thể loại / Lối câu sở trường
              </label>
              <div className="relative">
                <Fish className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={fishingStyle}
                  onChange={(e) => setFishingStyle(e.target.value)}
                  placeholder="vd: Câu Đài, Câu Lăng Xê, Câu Mồi Giả,..."
                  className="pl-9 h-10 rounded-xl bg-muted/40 border-border/60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tiểu sử ngắn (Bio)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Giới thiệu kinh nghiệm câu, thông điệp bảo vệ thiên nhiên..."
                className="w-full h-20 rounded-xl bg-muted/40 border border-border/60 p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="pt-2 border-t border-border/40 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                Kênh Mạng Xã Hội Đăng Tải
              </h4>

              <div className="space-y-2.5">
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500" />
                  <Input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Đường dẫn kênh YouTube (https://youtube.com/@...)"
                    className="pl-9 h-10 rounded-xl bg-muted/40 border-border/60 text-xs"
                  />
                </div>

                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                  <Input
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="Đường dẫn kênh TikTok (https://tiktok.com/@...)"
                    className="pl-9 h-10 rounded-xl bg-muted/40 border-border/60 text-xs"
                  />
                </div>

                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                  <Input
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="Đường dẫn trang Facebook cá nhân / Fanpage"
                    className="pl-9 h-10 rounded-xl bg-muted/40 border-border/60 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2.5 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={closeModal}
                className="h-11 w-full rounded-xl font-semibold sm:w-auto"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 h-11 rounded-xl font-semibold"
              >
                {submitting ? "Đang lưu..." : "Hoàn tất & Kích hoạt hồ sơ"}
              </Button>
            </div>
          </form>

          <AvatarCropper
            key={pendingAvatarFile ? `${pendingAvatarFile.name}-${pendingAvatarFile.size}-${pendingAvatarFile.lastModified}` : "avatar-cropper-empty"}
            file={pendingAvatarFile}
            onCancel={() => {
              setPendingAvatarFile(null)
              if (avatarInputRef.current) avatarInputRef.current.value = ""
            }}
            onApply={(croppedFile) => {
              setAvatarFile(croppedFile)
              setPendingAvatarFile(null)
              setRemoveAvatar(false)
              if (avatarInputRef.current) avatarInputRef.current.value = ""
            }}
          />

          {confirmRemoveAvatarOpen && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center bg-background/85 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="remove-avatar-title" onClick={() => setConfirmRemoveAvatarOpen(false)}>
              <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 id="remove-avatar-title" className="text-base font-bold">Xóa ảnh đại diện?</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Ảnh đại diện sẽ bị gỡ khỏi hồ sơ sau khi bạn lưu thay đổi.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setConfirmRemoveAvatarOpen(false)} className="rounded-full">
                    Hủy
                  </Button>
                  <Button type="button" variant="destructive" onClick={confirmRemoveAvatar} className="rounded-full">
                    Xóa ảnh
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
