import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const alt = "Nhật ký ngày đi câu - Bản ghi nội dung gốc cho nhà sáng tạo câu cá"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const logo = await readFile(join(process.cwd(), "public", "fishviet-logo-512.png"), "base64")
const logoSrc = `data:image/png;base64,${logo}`

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "72px 82px",
      color: "#eef8ff",
      background: "linear-gradient(135deg, #041426 0%, #0a3159 55%, #087fa5 100%)",
      fontFamily: "sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 32, fontWeight: 700 }}>
        <img src={logoSrc} width={82} height={82} alt="" style={{ borderRadius: 20 }} />
        Nhật ký ngày đi câu · FishViet.vn
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ maxWidth: 930, fontSize: 68, lineHeight: 1.03, letterSpacing: "-3px", fontWeight: 800 }}>
          Bản ghi nội dung gốc cho nhà sáng tạo câu cá.
        </div>
        <div style={{ fontSize: 27, color: "#b9dcf5" }}>
          Dấu thời gian · SHA-256 · Chuỗi phát hành minh bạch
        </div>
      </div>
    </div>,
    size
  )
}
