"use client"

import {
  ArrowSquareOut,
  At,
  Certificate,
  Check,
  Copy,
  FacebookLogo,
  Fish,
  GlobeSimple,
  InstagramLogo,
  LinkSimple,
  Plus,
  ShieldCheck,
  TiktokLogo,
  Trash,
  YoutubeLogo,
} from "@phosphor-icons/react"
import { use, useEffect, useState } from "react"
import { Header } from "@/components/Header"
import { PostCard } from "@/components/FeedComponents"
import { PUBLICATION_PLATFORMS, publicationLabel } from "@/lib/publications"

const PLATFORM_ICONS = {
  FACEBOOK: FacebookLogo,
  YOUTUBE: YoutubeLogo,
  TIKTOK: TiktokLogo,
  INSTAGRAM: InstagramLogo,
  THREADS: At,
  OTHER: GlobeSimple,
}

export default function PostDetailPage({ params }) {
  const { id } = use(params)
  const [post, setPost] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [platform, setPlatform] = useState("FACEBOOK")
  const [publicationUrl, setPublicationUrl] = useState("")
  const [publishedAt, setPublishedAt] = useState("")
  const [publicationError, setPublicationError] = useState("")
  const [submittingPublication, setSubmittingPublication] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      fetch(`/api/posts/${id}`).then((response) => response.json()),
      fetch("/api/auth/me").then((response) => response.json()),
    ]).then(([postData, userData]) => {
      if (!active) return
      if (postData.error) setError(postData.error)
      else setPost(postData)
      setCurrentUser(userData.user || null)
    }).catch(() => active && setError("Không thể tải nhật ký"))
    return () => { active = false }
  }, [id])

  const canManagePublications = Boolean(
    currentUser && post && (currentUser.id === post.author.id || currentUser.role === "ADMIN")
  )

  const copyProof = async () => {
    await navigator.clipboard.writeText(post.proofHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const addPublication = async (event) => {
    event.preventDefault()
    if (!publicationUrl.trim() || submittingPublication) return
    setSubmittingPublication(true)
    setPublicationError("")
    try {
      const response = await fetch(`/api/posts/${id}/publications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, url: publicationUrl, publishedAt: publishedAt || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể thêm liên kết")
      setPost((current) => ({ ...current, publications: [...(current.publications || []), data] }))
      setPublicationUrl("")
      setPublishedAt("")
    } catch (caught) {
      setPublicationError(caught.message)
    } finally {
      setSubmittingPublication(false)
    }
  }

  const removePublication = async (publicationId) => {
    const response = await fetch(`/api/posts/${id}/publications`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicationId }),
    })
    if (response.ok) {
      setPost((current) => ({
        ...current,
        publications: current.publications.filter((item) => item.id !== publicationId),
      }))
    }
  }

  return (
    <main id="main-content" className="min-h-[100dvh] w-full overflow-x-hidden px-4 pb-24 pt-24 sm:px-6">
      <Header />
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7">
          {!post && !error && <div className="h-96 rounded-2xl skeleton-shimmer" />}
          {error && (
            <div className="social-card flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <Fish size={42} weight="duotone" className="text-primary" />
              <h1 className="mt-5 text-2xl font-bold">{error}</h1>
            </div>
          )}
          {post && (
            <PostCard
              postId={post.id}
              author={post.author}
              time={post.createdAt}
              content={post.content}
              image={post.imageUrl}
              videoUrl={post.videoUrl}
              species={post.species}
              weightKg={post.weightKg}
              spotName={post.spotName}
              proofHash={post.proofHash}
              proofIssuedAt={post.proofIssuedAt}
              initialLikes={post.likeCount}
              initialIsLiked={post.isLiked}
              initialIsBookmarked={post.isBookmarked}
              initialComments={post.comments}
              currentUser={currentUser}
            />
          )}
        </section>

        {post && (
          <aside className="space-y-4 lg:col-span-5">
            <section className="social-card p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Certificate size={23} weight="duotone" /></span>
                <div>
                  <h1 className="text-xl font-bold tracking-[-0.03em]">Bản ghi nội dung gốc</h1>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Nhật ký ngày đi câu ghi nhận nội dung trước các liên kết phát hành bên ngoài.</p>
                </div>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div><dt className="text-muted-foreground">Tác giả</dt><dd className="mt-1 font-bold">{post.author.displayName || post.author.username}</dd></div>
                <div><dt className="text-muted-foreground">Thời điểm ghi nhận</dt><dd className="mt-1 font-bold">{new Date(post.proofIssuedAt).toLocaleString("vi-VN")}</dd></div>
                <div><dt className="text-muted-foreground">Thuật toán</dt><dd className="mt-1 font-bold">SHA-256 · v{post.proofVersion || 1}</dd></div>
                <div><dt className="text-muted-foreground">Nguồn gốc</dt><dd className="mt-1 font-bold text-primary">FishViet.vn</dd></div>
              </dl>
              {post.proofVersion >= 2 && (
                <div className="mt-4 rounded-xl bg-primary/8 p-4 ring-1 ring-primary/15">
                  <p className="text-xs font-bold text-primary">Payload kiểm chứng độc lập</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    Băm nội dung, metadata, thời điểm và {(post.proofPayload?.media || []).length} tệp upload theo byte gốc.
                  </p>
                  {(post.proofPayload?.media || []).map((asset) => (
                    <p key={asset.filename} className="mt-2 truncate font-mono text-[10px] text-muted-foreground" title={asset.sha256 || "Không có digest byte"}>
                      {asset.filename}: {asset.sha256 || "legacy-no-digest"}
                    </p>
                  ))}
                </div>
              )}
              <button type="button" onClick={copyProof} className="kinetic mt-5 flex w-full items-center justify-between rounded-xl bg-muted p-4 text-left active:scale-[0.98]">
                <span className="min-w-0"><span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Fingerprint</span><span className="mt-1 block truncate font-mono text-[10px]">{post.proofHash}</span></span>
                {copied ? <Check size={18} weight="bold" className="shrink-0 text-primary" /> : <Copy size={18} weight="duotone" className="shrink-0 text-muted-foreground" />}
              </button>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-primary"><ShieldCheck size={16} weight="duotone" /> Nhật ký ngày đi câu Content Proof v{post.proofVersion || 1}</div>
            </section>

            <section className="social-card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary"><LinkSimple size={21} weight="duotone" /></span>
                <div><h2 className="text-base font-bold">Chuỗi phát hành</h2><p className="text-xs text-muted-foreground">Đối chiếu bản gốc Nhật ký ngày đi câu với bài đã đăng nơi khác.</p></div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/8 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Fish size={19} weight="fill" /></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-bold">FishViet.vn</p><p className="text-[11px] text-muted-foreground">Bản ghi gốc · {new Date(post.proofIssuedAt).toLocaleString("vi-VN")}</p></div>
                  <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary">Gốc</span>
                </div>

                {(post.publications || []).map((publication) => {
                  const PlatformIcon = PLATFORM_ICONS[publication.platform] || GlobeSimple
                  return (
                    <div key={publication.id} className="group flex items-center gap-3 rounded-xl bg-muted/55 p-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-primary ring-1 ring-border"><PlatformIcon size={19} weight="duotone" /></span>
                      <a href={publication.url} target="_blank" rel="noopener noreferrer nofollow" className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 text-sm font-bold hover:text-primary">{publicationLabel(publication.platform)} <ArrowSquareOut size={13} /></p>
                        <p className="truncate text-[11px] text-muted-foreground">{publication.url}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{publication.publishedAt ? `Tác giả khai báo: ${new Date(publication.publishedAt).toLocaleString("vi-VN")}` : `Liên kết lúc: ${new Date(publication.createdAt).toLocaleString("vi-VN")}`}</p>
                      </a>
                      {canManagePublications && <button type="button" onClick={() => removePublication(publication.id)} aria-label="Xóa liên kết" className="kinetic flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-100 hover:bg-destructive/10 hover:text-destructive lg:opacity-0 lg:group-hover:opacity-100"><Trash size={16} weight="duotone" /></button>}
                    </div>
                  )
                })}
              </div>

              {(post.publications || []).length === 0 && <p className="mt-3 rounded-xl bg-muted/45 p-3 text-xs leading-5 text-muted-foreground">Tác giả chưa thêm bài phát hành trên nền tảng khác.</p>}

              {canManagePublications && (
                <form onSubmit={addPublication} className="mt-5 space-y-3 border-t border-border/70 pt-5">
                  <p className="text-xs font-bold">Thêm bài đã phát hành</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="h-10 rounded-lg bg-muted px-3 text-xs font-semibold outline-none ring-1 ring-border focus:ring-primary">
                      {PUBLICATION_PLATFORMS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    <input type="datetime-local" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} aria-label="Thời điểm đăng trên nền tảng" className="h-10 rounded-lg bg-muted px-3 text-xs outline-none ring-1 ring-border focus:ring-primary" />
                  </div>
                  <input type="url" required value={publicationUrl} onChange={(event) => setPublicationUrl(event.target.value)} placeholder="https://facebook.com/..." className="h-10 w-full rounded-lg bg-muted px-3 text-xs outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-primary" />
                  {publicationError && <p role="alert" className="text-xs text-destructive">{publicationError}</p>}
                  <button type="submit" disabled={submittingPublication || !publicationUrl.trim()} className="kinetic flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><Plus size={16} weight="bold" />{submittingPublication ? "Đang thêm..." : "Thêm vào chuỗi phát hành"}</button>
                </form>
              )}
            </section>
          </aside>
        )}
      </div>
    </main>
  )
}
