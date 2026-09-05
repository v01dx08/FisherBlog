export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fishviet.vn"
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/explore", "/profile/", "/post/", "/legal"],
        disallow: ["/admin/", "/api/", "/login"],
      },
    ],
    host: baseUrl,
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
