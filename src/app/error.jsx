"use client"

import { Fish, WarningCircle } from "@phosphor-icons/react"

export default function ErrorPage({ error, reset }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background p-5">
      <section className="social-card w-full max-w-lg p-8 text-center" role="alert">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <WarningCircle size={28} weight="duotone" />
        </span>
        <h1 className="mt-5 text-xl font-bold">Nhật ký ngày đi câu gặp lỗi tạm thời</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Thử tải lại. Nếu lỗi lặp lại, gửi mã lỗi cho quản trị viên.
        </p>
        {error?.digest && <p className="mt-3 font-mono text-[11px] text-muted-foreground">Mã: {error.digest}</p>}
        <button type="button" onClick={reset} className="kinetic mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Fish size={17} weight="fill" /> Thử lại
        </button>
      </section>
    </main>
  )
}
