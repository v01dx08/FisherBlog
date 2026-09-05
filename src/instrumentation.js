export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const { logEvent } = await import("@/lib/http")
  logEvent("info", "app.start", {
    environment: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    uploadStorage: process.env.UPLOAD_DIR ? "configured" : "default",
  })
}
