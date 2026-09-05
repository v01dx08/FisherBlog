"use client"

export default function GlobalError({ reset }) {
  return (
    <html lang="vi">
      <body style={{ margin: 0, background: "#edf4fb", color: "#10233c", fontFamily: "sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <section style={{ maxWidth: 480, padding: 32, borderRadius: 20, background: "white", textAlign: "center" }}>
            <h1>Không thể tải Nhật ký ngày đi câu</h1>
            <p>Hệ thống gặp lỗi ngoài dự kiến. Vui lòng thử lại.</p>
            <button type="button" onClick={reset} style={{ border: 0, borderRadius: 12, padding: "12px 20px", background: "#1677d2", color: "white", fontWeight: 700 }}>Thử lại</button>
          </section>
        </main>
      </body>
    </html>
  )
}
