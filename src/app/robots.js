export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fishviet.vn"
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/explore", "/profile/", "/post/"], disallow: ["/admin", "/api/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
