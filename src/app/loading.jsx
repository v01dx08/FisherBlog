import { Fish } from "@phosphor-icons/react/dist/ssr"

export default function Loading() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background" aria-busy="true">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Fish size={28} weight="duotone" />
        </span>
        <p className="mt-4 text-sm font-semibold">Đang tải Nhật ký ngày đi câu...</p>
      </div>
    </main>
  )
}
