import { RequestError } from "./http.js"
import { cleanText, validateHttpUrl } from "./security.js"

export const PUBLICATION_PLATFORMS = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "THREADS", label: "Threads" },
  { value: "OTHER", label: "Nền tảng khác" },
]

const PLATFORM_HOSTS = {
  FACEBOOK: ["facebook.com", "fb.watch"],
  YOUTUBE: ["youtube.com", "youtu.be"],
  TIKTOK: ["tiktok.com"],
  INSTAGRAM: ["instagram.com"],
  THREADS: ["threads.net", "threads.com"],
}

function hostMatches(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`)
}

export function publicationLabel(platform) {
  return PUBLICATION_PLATFORMS.find((item) => item.value === platform)?.label || "Nền tảng khác"
}

export function validatePublicationInput(input) {
  const platform = cleanText(input.platform, { name: "Nền tảng", max: 20 }).toUpperCase()
  if (!PUBLICATION_PLATFORMS.some((item) => item.value === platform)) {
    throw new RequestError("Nền tảng không được hỗ trợ", 400)
  }

  const url = validateHttpUrl(input.url, "Liên kết bài viết")
  const parsedUrl = new URL(url)
  const allowedHosts = PLATFORM_HOSTS[platform]
  if (allowedHosts && !allowedHosts.some((domain) => hostMatches(parsedUrl.hostname.toLowerCase(), domain))) {
    throw new RequestError(`Liên kết không thuộc ${publicationLabel(platform)}`, 400)
  }

  let publishedAt = null
  if (input.publishedAt) {
    publishedAt = new Date(input.publishedAt)
    if (Number.isNaN(publishedAt.getTime())) throw new RequestError("Thời điểm đăng không hợp lệ", 400)
    if (publishedAt.getTime() > Date.now() + 5 * 60_000) throw new RequestError("Thời điểm đăng không thể ở tương lai", 400)
  }

  return { platform, url, publishedAt }
}
