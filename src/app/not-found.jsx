import { Fish } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background p-5">
      <section className="social-card w-full max-w-lg p-9 text-center">
        <Fish size={44} weight="duotone" className="mx-auto text-primary" />
        <h1 className="mt-5 text-2xl font-bold">Không tìm thấy nội dung</h1>
        <p className="mt-2 text-sm text-muted-foreground">Bản ghi đã bị gỡ, chuyển riêng tư hoặc đường dẫn không đúng.</p>
        <Link href="/" className="kinetic mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">Về bảng tin</Link>
      </section>
    </main>
  )
}
