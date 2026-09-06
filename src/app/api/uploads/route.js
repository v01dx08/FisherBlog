import { createHash, randomUUID } from "node:crypto"
import { unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { handleRouteError, json, RequestError } from "@/lib/http"
import { assertSameOrigin } from "@/lib/security"
import { ensureUploadDirectory, extensionForMime, matchesFileSignature, MAX_AVATAR_BYTES, MAX_UPLOAD_BYTES, UPLOAD_DIR } from "@/lib/storage"
import { enforceRateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"

export async function POST(request) {
  try {
    assertSameOrigin(request)
    const user = await requireUser(request)
    await enforceRateLimit(request, { scope: "uploads.create", actorId: user.id, limit: 40, windowMs: 60 * 60 * 1000 })

    const declaredLength = Number(request.headers.get("content-length") || 0)
    if (declaredLength > MAX_UPLOAD_BYTES + 1_000_000) {
      throw new RequestError("Tệp vượt quá giới hạn 15 MB", 413)
    }

    const form = await request.formData()
    const file = form.get("file")
    const purpose = form.get("purpose")
    if (!(file instanceof File)) throw new RequestError("Thiếu tệp tải lên", 400)
    if (purpose && purpose !== "avatar") throw new RequestError("Mục đích tải lên không hợp lệ", 400)
    if (purpose === "avatar" && (!file.type.startsWith("image/") || file.size > MAX_AVATAR_BYTES)) {
      throw new RequestError("Ảnh đại diện phải là JPG, PNG, WebP hoặc GIF và nhỏ hơn 5 MB", 415)
    }
    if (file.size < 1 || file.size > MAX_UPLOAD_BYTES) {
      throw new RequestError("Tệp cần nhỏ hơn 15 MB", 413)
    }

    const extension = extensionForMime(file.type)
    if (!extension) throw new RequestError("Chỉ hỗ trợ JPG, PNG, WebP, GIF, MP4 hoặc WebM", 415)
    const buffer = Buffer.from(await file.arrayBuffer())
    if (!matchesFileSignature(buffer, file.type)) {
      throw new RequestError("Nội dung tệp không khớp định dạng khai báo", 415)
    }

    await ensureUploadDirectory()
    const filename = `${randomUUID()}${extension}`
    const filePath = path.join(UPLOAD_DIR, filename)
    const sha256 = createHash("sha256").update(buffer).digest("hex")
    await writeFile(filePath, buffer, {
      flag: "wx",
    })
    try {
      await db.mediaAsset.create({
        data: {
          filename,
          mimeType: file.type,
          size: file.size,
          sha256,
          ownerId: user.id,
        },
      })
    } catch (error) {
      await unlink(filePath).catch(() => {})
      throw error
    }

    // ponytail: Local volume supports one Docker node. Move this adapter to S3/R2 before horizontal scaling.
    return json({ url: `/api/uploads/${filename}`, type: file.type, size: file.size, sha256 }, 201)
  } catch (caught) {
    return handleRouteError("uploads.create", caught, request)
  }
}
