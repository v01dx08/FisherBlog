"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Bell, Check, DownloadSimple, EyeSlash, Lock, Moon, Sun, UserCircle, X } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { OnboardingModal } from "@/components/OnboardingModal"

export function SettingsModal({ isOpen, onClose }) {
  const { theme, setTheme } = useTheme()
  const [hideLocation, setHideLocation] = useState(false)
  const [notifyInteractions, setNotifyInteractions] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentUser, setCurrentUser] = useState(null)
  const [profileEditorOpen, setProfileEditorOpen] = useState(false)
  const profileEditorOpenRef = useRef(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    profileEditorOpenRef.current = profileEditorOpen
  }, [profileEditorOpen])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    fetch("/api/settings")
      .then((response) => response.json())
      .then((data) => {
        if (!data.error) {
          setHideLocation(Boolean(data.hideLocation))
          setNotifyInteractions(data.notifyInteractions !== false)
        }
      })
      .catch(() => setMessage("Không thể tải thiết lập."))
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setCurrentUser(data.user || null))
      .catch(() => {})
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return
      if (profileEditorOpenRef.current) setProfileEditorOpen(false)
      else onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const save = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp.")
      return
    }

    setSaving(true)
    setMessage("")
    try {
      const settingsResponse = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hideLocation, notifyInteractions }),
      })
      const settingsData = await settingsResponse.json()
      if (!settingsResponse.ok) throw new Error(settingsData.error)

      if (newPassword) {
        const passwordResponse = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        })
        const passwordData = await passwordResponse.json()
        if (!passwordResponse.ok) throw new Error(passwordData.error)
      }

      setMessage("Đã lưu thiết lập.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(onClose, 700)
    } catch (error) {
      setMessage(error.message || "Không thể lưu thiết lập.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="bezel w-full max-w-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="bezel-core max-h-[85dvh] overflow-y-auto p-6 custom-scrollbar sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Tài khoản</p>
                <h2 id="settings-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Riêng tư và bảo mật</h2>
              </div>
              <button type="button" onClick={onClose} aria-label="Đóng" className="kinetic flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"><X size={17} weight="light" /></button>
            </div>

            <div className="mt-7 space-y-3">
              {currentUser && (
                <button type="button" onClick={() => setProfileEditorOpen(true)} className="kinetic flex w-full items-center justify-between gap-4 rounded-[1.5rem] bg-muted/55 p-4 text-left active:scale-[0.99]">
                  <span className="flex min-w-0 items-center gap-3">
                    <UserCircle size={19} weight="light" className="shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">Chỉnh sửa hồ sơ</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">Ảnh bìa, ảnh đại diện, tiểu sử và liên kết mạng xã hội.</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-primary">Mở</span>
                </button>
              )}
              <label className="flex items-start justify-between gap-4 rounded-[1.5rem] bg-muted/55 p-4">
                <span className="flex gap-3"><EyeSlash size={19} weight="light" className="mt-0.5 shrink-0 text-primary" /><span><span className="block text-sm font-semibold">Ẩn địa điểm trên hồ sơ</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Chỉ bạn và quản trị viên thấy địa điểm.</span></span></span>
                <input type="checkbox" checked={hideLocation} onChange={(event) => setHideLocation(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
              </label>
              <label className="flex items-start justify-between gap-4 rounded-[1.5rem] bg-muted/55 p-4">
                <span className="flex gap-3"><Bell size={19} weight="light" className="mt-0.5 shrink-0 text-primary" /><span><span className="block text-sm font-semibold">Thông báo tương tác</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Nhận thông báo khi có lượt thích, bình luận hoặc theo dõi.</span></span></span>
                <input type="checkbox" checked={notifyInteractions} onChange={(event) => setNotifyInteractions(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
              </label>
              <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="kinetic flex w-full items-center justify-between rounded-[1.5rem] bg-muted/55 p-4 text-left active:scale-[0.99]">
                <span className="flex items-center gap-3">{theme === "dark" ? <Moon size={19} weight="light" className="text-primary" /> : <Sun size={19} weight="light" className="text-primary" />}<span><span className="block text-sm font-semibold">Giao diện</span><span className="mt-1 block text-xs text-muted-foreground">{theme === "dark" ? "Tối" : "Sáng"}</span></span></span>
                <span className="text-xs font-semibold text-primary">Đổi</span>
              </button>
            </div>

            <div className="mt-8 border-t border-border/60 pt-7">
              <div className="flex items-center gap-2"><Lock size={18} weight="light" className="text-primary" /><h3 className="text-sm font-semibold">Đổi mật khẩu</h3></div>
              <p className="mt-1 text-xs text-muted-foreground">Để trống nếu không muốn đổi.</p>
              <div className="mt-4 grid gap-3">
                <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Mật khẩu hiện tại" autoComplete="current-password" className="h-11 rounded-[1.1rem] bg-muted px-4 text-sm outline-none" />
                <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Mật khẩu mới: 10+ ký tự, hoa, thường, số" autoComplete="new-password" className="h-11 rounded-[1.1rem] bg-muted px-4 text-sm outline-none" />
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" className="h-11 rounded-[1.1rem] bg-muted px-4 text-sm outline-none" />
              </div>
            </div>

            <div className="mt-8 border-t border-border/60 pt-7">
              <div className="flex items-center gap-2"><DownloadSimple size={18} weight="light" className="text-primary" /><h3 className="text-sm font-semibold">Dữ liệu tài khoản</h3></div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Tải bản JSON gồm hồ sơ, bài viết, dấu vết chứng nhận và hoạt động của bạn.</p>
              <a href="/api/account/export" download className="kinetic mt-4 inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-xs font-semibold hover:bg-primary/10 hover:text-primary">
                <DownloadSimple size={16} weight="light" /> Xuất dữ liệu
              </a>
            </div>

            {message && <p role="status" className={`mt-5 rounded-2xl px-4 py-3 text-xs ${message.startsWith("Đã") ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{message}</p>}

            <button type="button" onClick={save} disabled={saving} className="kinetic group mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-primary py-2 pl-6 pr-2 text-sm font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-50">
              {saving ? "Đang lưu..." : "Lưu thiết lập"}
              <span className="kinetic flex h-8 w-8 items-center justify-center rounded-full bg-white/15 group-hover:scale-105"><Check size={16} weight="light" /></span>
            </button>
          </div>
        </motion.div>
      </div>
      </AnimatePresence>
      {currentUser && profileEditorOpen && (
        <OnboardingModal
          isOpen={profileEditorOpen}
          user={currentUser}
          onClose={() => setProfileEditorOpen(false)}
          onComplete={(updated) => {
            setCurrentUser((user) => ({ ...user, ...updated }))
            setProfileEditorOpen(false)
          }}
        />
      )}
    </>
  )
}
