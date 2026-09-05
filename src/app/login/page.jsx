"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, User, Waves, AlertCircle } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedCallback = searchParams.get("callbackUrl") || ""
  const callbackUrl = requestedCallback.startsWith("/") && !requestedCallback.startsWith("//")
    ? requestedCallback
    : ""
  const errorParam = searchParams.get("error")

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(
    errorParam === "unauthorized"
      ? "Bạn cần đăng nhập bằng tài khoản Quản trị viên (ADMIN) để truy cập trang này."
      : ""
  )

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMessage("")

    if (!username || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || "Đăng nhập thất bại.")
        setLoading(false)
        return
      }

      const targetUrl = callbackUrl || (data.user?.role === "ADMIN" ? "/admin" : "/")
      router.push(targetUrl)
      router.refresh()
    } catch {
      setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.")
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full max-w-md"
    >
      <div className="lg:hidden flex items-center gap-2.5 mb-10">
        <Image src="/fishviet-logo-192.png" width={40} height={40} alt="Logo Nhật ký ngày đi câu" className="h-10 w-10 rounded-xl object-cover ring-1 ring-primary/15" />
        <span className="text-xl font-bold tracking-tight">Ngày <span className="text-primary">đi câu</span></span>
      </div>

      <h1 className="text-3xl font-bold mb-2">Chào mừng trở lại</h1>
      <p className="text-muted-foreground mb-6">Đăng nhập vào tài khoản để tiếp tục.</p>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tên đăng nhập hoặc Email</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập hoặc email"
              className="pl-11 h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-background"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Mật khẩu</label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="pl-11 h-12 rounded-xl bg-muted/40 border-border/60 focus:bg-background"
              disabled={loading}
            />
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-semibold transition-all">
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </Button>
        </motion.div>
      </form>

      <div className="mt-8 pt-6 border-t border-border/40">
        <p className="text-sm text-muted-foreground text-center">
          Tài khoản được cấp bởi quản trị viên Nhật ký ngày đi câu.
          <br />
          <a href="/legal" className="text-primary hover:underline">Đọc Điều khoản và Chính sách Quyền riêng tư</a>
        </p>
      </div>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left: Hero Visual */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-primary overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${8 + (i * 3) % 25}px`,
              height: `${8 + (i * 3) % 25}px`,
              left: `${(i * 17) % 100}%`,
              bottom: `-20px`,
              animation: `float-up ${6 + (i * 1.3) % 8}s ease-in-out infinite`,
              animationDelay: `${(i * 0.8) % 6}s`,
            }}
          />
        ))}

        <div className="relative z-10 max-w-lg px-12 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Image src="/fishviet-logo-192.png" width={56} height={56} alt="Logo Nhật ký ngày đi câu" className="h-14 w-14 rounded-2xl object-cover shadow-xl ring-1 ring-white/25" />
              <h1 className="text-3xl font-bold tracking-tight">Nhật ký ngày đi câu</h1>
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Bảo vệ nội dung
              <br />
              gốc của bạn
              <br />
              <span className="opacity-70">trước bất kỳ ai.</span>
            </h2>

            <p className="text-lg text-white/70 leading-relaxed mb-8">
              Nền tảng dành riêng cho các influencer câu cá để đánh dấu thời gian, chia sẻ và bảo vệ nội dung gốc của mình.
            </p>

            <div className="flex items-center gap-6 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4" />
                <span>Bảo vệ bản quyền</span>
              </div>
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4" />
                <span>Chỉ được mời</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Đang tải biểu mẫu...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
