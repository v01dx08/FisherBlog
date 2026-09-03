import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { Readable } from "node:stream"
import { error } from "@/lib/http"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { mimeForFilename, safeUploadPath } from "@/lib/storage"

export const runtime = "nodejs"

export async function GET(request, { params }) {
  const { filename } = await params
  const filePath = safeUploadPath(filename)
  if (!filePath) return error("Không tìm thấy tệp", 404)

  try {
    const [asset, user] = await Promise.all([
      db.mediaAsset.findUnique({
        where: { filename },
        include: { post: { select: { visibility: true } } },
      }),
      getCurrentUser(request),
    ])
    if (!asset) return error("Không tìm thấy tệp", 404)
    const canRead = asset.post?.visibility === "PUBLIC" || user?.id === asset.ownerId || user?.role === "ADMIN"
    if (!canRead) return error("Không tìm thấy tệp", 404)

    const file = await stat(filePath)
    const range = request.headers.get("range")
    const headers = {
      "Content-Type": asset.mimeType || mimeForFilename(filename),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    }

    if (!range) {
      headers["Content-Length"] = String(file.size)
      return new Response(Readable.toWeb(createReadStream(filePath)), { headers })
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (!match) return new Response(null, { status: 416 })
    const start = match[1] ? Number(match[1]) : 0
    const end = match[2] ? Math.min(Number(match[2]), file.size - 1) : file.size - 1
    if (start > end || start >= file.size) return new Response(null, { status: 416 })

    headers["Content-Length"] = String(end - start + 1)
    headers["Content-Range"] = `bytes ${start}-${end}/${file.size}`
    return new Response(Readable.toWeb(createReadStream(filePath, { start, end })), {
      status: 206,
      headers,
    })
  } catch {
    return error("Không tìm thấy tệp", 404)
  }
}
