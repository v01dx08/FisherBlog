"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Search,
  Mail,
  Calendar,
  Fish,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Video,
  ExternalLink,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AdminLineChart } from "@/components/AdminLineChart"
import Link from "next/link"

function firstImageUrl(value) {
  if (!value) return null
  try {
    const images = JSON.parse(value)
    return Array.isArray(images) ? images[0] || null : value
  } catch {
    return value
  }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users") // 'users' | 'posts'
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState(null)
  const [newUsername, setNewUsername] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [postSearchQuery, setPostSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ type: "", message: "" })
  const [confirmation, setConfirmation] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/posts?limit=30").then((r) => r.json()),
      fetch("/api/admin/stats").then((r) => r.json()),
    ])
      .then(([usersRes, postsRes, statsRes]) => {
        if (!active) return
        if (Array.isArray(usersRes)) setUsers(usersRes)
        if (Array.isArray(postsRes.items)) setPosts(postsRes.items)
        if (statsRes && !statsRes.error) setStats(statsRes)
      })
      .catch(() => active && setFeedback({ type: "error", message: "Lỗi kết nối máy chủ khi tải dữ liệu quản trị." }))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const handleAddUser = async (e) => {
    e.preventDefault()
    setFeedback({ type: "", message: "" })

    if (!newUsername.trim() || !newEmail.trim() || !newPassword) {
      setFeedback({ type: "error", message: "Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu." })
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
        password: newPassword.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Tạo tài khoản thất bại." })
        setSubmitting(false)
        return
      }

      setUsers((prev) => [data, ...prev])
      setFeedback({
        type: "success",
        message: `Đã cấp tài khoản thành công cho ${data.username}.`,
      })
      setNewUsername("")
      setNewEmail("")
      setNewPassword("")
    } catch {
      setFeedback({ type: "error", message: "Lỗi kết nối máy chủ khi tạo tài khoản." })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (id, username) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Không thể xoá tài khoản." })
        return
      }

      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "SUSPENDED" } : u)))
      setFeedback({ type: "success", message: `Đã thu hồi tài khoản "${username}".` })
    } catch {
      setFeedback({ type: "error", message: "Lỗi kết nối khi xoá tài khoản." })
    }
  }

  const handleActivateUser = async (id, username) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH" })
      const data = await res.json()
      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Không thể kích hoạt tài khoản." })
        return
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "ACTIVE" } : u)))
      setFeedback({ type: "success", message: `Đã kích hoạt lại tài khoản "${username}".` })
    } catch {
      setFeedback({ type: "error", message: "Lỗi kết nối khi kích hoạt tài khoản." })
    }
  }

  const handleDeletePost = async (postId) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Không thể gỡ bài viết." })
        return
      }

      setPosts((prev) => prev.filter((p) => p.id !== postId))
      setFeedback({ type: "success", message: "Đã gỡ bài viết vi phạm thành công." })
    } catch {
      setFeedback({ type: "error", message: "Lỗi kết nối khi gỡ bài viết." })
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  )

  const filteredPosts = posts.filter(
    (p) =>
      p.content?.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      p.author?.username?.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      p.author?.displayName?.toLowerCase().includes(postSearchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <Header />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bảng Điều Khiển Quản Trị</h1>
              <p className="text-sm text-muted-foreground">
                Hệ thống Nhật ký ngày đi câu &middot; Phân tích, cấp quyền và kiểm duyệt nội dung
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/70 border border-border/40">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "users"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Cần thủ & Cấp quyền
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "posts"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Kiểm duyệt Bài viết ({posts.length})
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback.message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl text-sm flex items-start gap-3 border ${
              feedback.type === "error"
                ? "bg-destructive/10 border-destructive/20 text-destructive"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {feedback.type === "error" ? (
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <span className="leading-relaxed">{feedback.message}</span>
          </motion.div>
        )}

        {/* KPIs Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Tổng Cần thủ",
              value: stats?.kpis?.totalUsers || users.length,
              icon: Users,
              color: "bg-primary/10 text-primary",
            },
            {
              label: "Tổng Bài viết gốc",
              value: stats?.kpis?.totalPosts || posts.length,
              icon: FileText,
              color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Lượt thả cá",
              value: stats?.kpis?.totalLikes || 0,
              icon: Fish,
              color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
            },
            {
              label: "Lượt Phản hồi (Comment)",
              value: stats?.kpis?.totalComments || 0,
              icon: Mail,
              color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl ${stat.color} border border-border/40 p-5`}
            >
              <stat.icon className="h-5 w-5 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Interactive Line Chart */}
        <div className="bg-card rounded-3xl border border-border/60 p-6 sm:p-7 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base">Xu hướng Hoạt động & Tương tác 7 Ngày Qua</h3>
                <p className="text-xs text-muted-foreground">
                  Theo dõi tần suất đăng bài và mức độ tương tác của cộng đồng
                </p>
              </div>
            </div>
          </div>
          <AdminLineChart data={stats?.timeline || []} />
        </div>

        {/* TAB 1: USERS */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add User Form */}
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
              <div className="bg-card rounded-3xl border border-border/60 p-6 shadow-sm sticky top-24">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Cấp tài khoản mới</h2>
                    <p className="text-xs text-muted-foreground">Tạo tài khoản độc quyền cho Influencer</p>
                  </div>
                </div>

                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tên đăng nhập</label>
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="vd: MinhDucFishing"
                      className="h-11 rounded-xl bg-muted/40 border-border/60"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Địa chỉ Email</label>
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="minhduc@example.com"
                      className="h-11 rounded-xl bg-muted/40 border-border/60"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Mật khẩu khởi tạo</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 10 ký tự, có hoa, thường, số"
                      className="h-11 rounded-xl bg-muted/40 border-border/60"
                      disabled={submitting}
                    />
                    <p className="text-[11px] text-muted-foreground">Không hiển thị lại mật khẩu sau khi tạo.</p>
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 rounded-xl font-semibold mt-2"
                  >
                    {submitting ? "Đang tạo..." : "Cấp tài khoản"}
                  </Button>
                </form>
              </div>
            </motion.div>

            {/* Users List */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
              <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border/40">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-semibold text-lg">Danh sách Cần thủ</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="search"
                        placeholder="Tìm kiếm cần thủ..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="h-9 w-56 rounded-lg bg-muted/60 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-border/40">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors"
                    >
                      <Link href={`/profile/${user.username}`}>
                        <Avatar className="h-11 w-11 cursor-pointer">
                          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.username} className="object-cover" />}
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${user.username}`}
                            className="font-semibold text-sm hover:underline truncate"
                          >
                            {user.username}
                          </Link>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              user.role === "ADMIN"
                                ? "bg-primary/10 text-primary"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {user.role === "ADMIN" ? "Quản trị viên" : "Influencer"}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                            {user.status === "ACTIVE" ? "Hoạt động" : "Đã thu hồi"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-medium">{user.posts || 0} bài viết</p>
                        <p className="text-xs text-muted-foreground">Tham gia {user.joined}</p>
                      </div>
                      {user.role !== "ADMIN" && user.status === "ACTIVE" && (
                        <button
                          onClick={() => setConfirmation({ type: "user", id: user.id, username: user.username })}
                          aria-label={`Thu hồi tài khoản ${user.username}`}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10"
                          title="Thu hồi tài khoản"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {user.role !== "ADMIN" && user.status === "SUSPENDED" && (
                        <button onClick={() => handleActivateUser(user.id, user.username)} className="text-primary text-xs font-semibold px-3 py-2 rounded-lg hover:bg-primary/10">
                          Kích hoạt lại
                        </button>
                      )}
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Fish className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p>Không tìm thấy cần thủ nào phù hợp.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* TAB 2: POSTS MODERATION */}
        {activeTab === "posts" && (
          <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/40">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-lg">Kiểm duyệt Nội dung Bài viết</h2>
                  <p className="text-xs text-muted-foreground">
                    Giám sát toàn bộ bài viết đã xuất bản, gỡ bỏ bài vi phạm bản quyền
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Tìm kiếm nội dung bài viết..."
                    value={postSearchQuery}
                    onChange={(e) => setPostSearchQuery(e.target.value)}
                    className="h-9 w-64 rounded-lg bg-muted/60 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/40">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 hover:bg-muted/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {post.imageUrl ? (
                      <img
                        src={firstImageUrl(post.imageUrl)}
                        alt="Ảnh bài viết"
                        className="h-16 w-20 rounded-xl object-cover shrink-0 border border-border/40"
                      />
                    ) : post.videoUrl ? (
                      <div className="h-16 w-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Video className="h-6 w-6 text-primary" />
                      </div>
                    ) : (
                      <div className="h-16 w-20 rounded-xl bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {post.author?.displayName || post.author?.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          &middot; {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground font-medium">
                        <span>{post.likeCount || 0} lượt thích</span>
                        <span>{post.comments?.length || 0} bình luận</span>
                        {post.videoUrl && (
                          <span className="text-primary flex items-center gap-1">
                            <Video className="h-3 w-3" /> Có video clip
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href={`/profile/${post.author?.username}`}
                      className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Xem trang cá nhân tác giả"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmation({ type: "post", id: post.id })}
                      className="rounded-xl h-8 px-3 text-xs gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Gỡ bài
                    </Button>
                  </div>
                </div>
              ))}

              {filteredPosts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Không có bài viết nào phù hợp.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {confirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" onClick={() => setConfirmation(null)}>
          <section className="social-card w-full max-w-md p-6" onClick={(event) => event.stopPropagation()}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><AlertCircle className="h-5 w-5" /></span>
            <h2 id="admin-confirm-title" className="mt-4 text-lg font-bold">
              {confirmation.type === "user" ? "Thu hồi tài khoản?" : "Gỡ bài viết?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {confirmation.type === "user"
                ? `Tài khoản “${confirmation.username}” mất quyền truy cập ngay. Có thể kích hoạt lại sau.`
                : "Bài viết và media đính kèm sẽ bị xóa vĩnh viễn. Hành động không thể hoàn tác."}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmation(null)}>Hủy</Button>
              <Button variant="destructive" autoFocus onClick={async () => {
                const pending = confirmation
                setConfirmation(null)
                if (pending.type === "user") await handleDeleteUser(pending.id, pending.username)
                else await handleDeletePost(pending.id)
              }}>
                {confirmation.type === "user" ? "Thu hồi" : "Xóa vĩnh viễn"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
