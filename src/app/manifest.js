export default function manifest() {
  return {
    name: "Nhật ký ngày đi câu - Bản ghi nội dung gốc",
    short_name: "Nhật ký ngày đi câu",
    description: "Mạng xã hội ghi nhận bản gốc và chuỗi phát hành nội dung câu cá Việt Nam.",
    start_url: "/",
    display: "standalone",
    background_color: "#edf4fb",
    theme_color: "#1677d2",
    lang: "vi",
    icons: [
      { src: "/fishviet-logo-192.png", sizes: "192x192", type: "image/png" },
      { src: "/fishviet-logo-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
