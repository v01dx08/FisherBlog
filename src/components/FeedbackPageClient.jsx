"use client"

import { useState } from "react"
import { ChatCenteredText, CheckCircle, Lightbulb, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react"
import { Header } from "@/components/Header"
import { LeftSidebar } from "@/components/LeftSidebar"
import { RightSidebar } from "@/components/RightSidebar"

const categories = [
  { value: "BUG", label: "Báo lỗi" },
  { value: "UX", label: "Trải nghiệm" },
  { value: "FEATURE", label: "Tính năng mới" },
  { value: "PERFORMANCE", label: "Hiệu năng" },
  { value: "CONTENT", label: "Nội dung" },
  { value: "OTHER", label: "Khác" },
]

const priorities = [
  { value: "LOW", label: "Nhẹ" },
  { value: "MEDIUM", label: "Nên cải thiện" },
  { value: "HIGH", label: "Quan trọng" },
]

export function FeedbackPageClient({ currentUser }) {
  const [form, setForm] = useState({
    category: "UX",
    priority: "MEDIUM",
    subject: "",
    message: "",
    contact: currentUser?.email || "",
  })
  const [status, setStatus] = useState({ type: "", message: "" })
  const [submitting, setSubmitting] = useState(false)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ type: "", message: "" })
    setSubmitting(true)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể gửi góp ý lúc này.")

      setStatus({ type: "success", message: "Cảm ơn bạn. Góp ý đã được gửi đến đội phát triển." })
      setForm((current) => ({ ...current, subject: "", message: "" }))
    } catch (caught) {
      setStatus({ type: "error", message: caught.message || "Không thể gửi góp ý lúc này." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main id="main-content" className="h-[100dvh] w-full overflow-hidden bg-background">
      <Header />
      <div className="grid h-full w-full grid-cols-1 gap-5 overflow-hidden px-3 pb-[76px] pt-[76px] sm:px-5 md:pb-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,760px)_minmax(320px,1fr)] xl:grid-cols-[280px_minmax(24px,1fr)_minmax(0,760px)_minmax(24px,1fr)_320px] xl:gap-6 min-[2100px]:mx-auto min-[2100px]:max-w-[1560px]">
        <div className="hidden min-w-0 xl:col-start-1 xl:block"><LeftSidebar /></div>

        <section className="custom-scrollbar min-h-0 min-w-0 overflow-y-auto pb-8 lg:col-start-2 xl:col-start-3">
          <div className="mb-5 px-1">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <ChatCenteredText size={24} weight="duotone" />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-[-0.025em] sm:text-3xl">Góp ý cải thiện FishViet</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Chia sẻ lỗi bạn gặp, phần khó dùng, hoặc ý tưởng giúp cộng đồng đi câu dùng web thoải mái hơn.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <form onSubmit={submit} className="social-card min-w-0 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold text-muted-foreground">Loại góp ý</span>
                  <select
                    value={form.category}
                    onChange={(event) => update("category", event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl bg-muted/70 px-3 text-sm outline-none ring-1 ring-border/70 focus:bg-card focus:ring-primary/35"
                  >
                    {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-muted-foreground">Mức độ</span>
                  <select
                    value={form.priority}
                    onChange={(event) => update("priority", event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl bg-muted/70 px-3 text-sm outline-none ring-1 ring-border/70 focus:bg-card focus:ring-primary/35"
                  >
                    {priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
                  </select>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-bold text-muted-foreground">Tiêu đề</span>
                <input
                  value={form.subject}
                  onChange={(event) => update("subject", event.target.value)}
                  maxLength={120}
                  required
                  placeholder="Ví dụ: Khung chat trên mobile hơi chật"
                  className="mt-1.5 h-11 w-full rounded-xl bg-muted/70 px-3 text-sm outline-none ring-1 ring-border/70 placeholder:text-muted-foreground focus:bg-card focus:ring-primary/35"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-xs font-bold text-muted-foreground">Nội dung chi tiết</span>
                <textarea
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                  maxLength={4000}
                  required
                  rows={8}
                  placeholder="Bạn muốn web cải thiện điều gì? Nếu là lỗi, hãy ghi trang bạn đang dùng và thao tác dẫn đến lỗi."
                  className="mt-1.5 w-full resize-none rounded-xl bg-muted/70 px-3 py-3 text-sm leading-6 outline-none ring-1 ring-border/70 placeholder:text-muted-foreground focus:bg-card focus:ring-primary/35"
                />
              </label>

              <label className="mt-4 block">
                <span className="text-xs font-bold text-muted-foreground">Liên hệ lại nếu cần</span>
                <input
                  value={form.contact}
                  onChange={(event) => update("contact", event.target.value)}
                  maxLength={160}
                  placeholder="Email, username, Facebook..."
                  className="mt-1.5 h-11 w-full rounded-xl bg-muted/70 px-3 text-sm outline-none ring-1 ring-border/70 placeholder:text-muted-foreground focus:bg-card focus:ring-primary/35"
                />
              </label>

              {status.message && (
                <div className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${status.type === "success" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`} role="alert">
                  {status.type === "success" ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" weight="bold" /> : <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" weight="bold" />}
                  <span>{status.message}</span>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="kinetic inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[0_8px_26px_rgba(34,139,230,0.2)] hover:bg-primary/90 disabled:opacity-50"
                >
                  <PaperPlaneTilt size={18} weight="bold" />
                  {submitting ? "Đang gửi..." : "Gửi góp ý"}
                </button>
              </div>
            </form>

            <aside className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-300">
                <Lightbulb size={22} weight="duotone" />
              </span>
              <h2 className="mt-3 text-sm font-bold">Gợi ý viết feedback tốt</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                <li>Ghi rõ bạn đang dùng mobile hay PC.</li>
                <li>Nếu là lỗi, mô tả các bước để lặp lại.</li>
                <li>Nếu là tính năng mới, nói rõ lợi ích khi đi câu.</li>
              </ul>
            </aside>
          </div>
        </section>

        <div className="hidden min-w-0 justify-self-end lg:col-start-3 lg:block xl:col-start-5"><RightSidebar /></div>
      </div>
    </main>
  )
}
