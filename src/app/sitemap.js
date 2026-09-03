export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fishviet.vn"
  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/explore`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/legal`, changeFrequency: "yearly", priority: 0.2 },
  ]
}
