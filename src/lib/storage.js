import { mkdir } from "node:fs/promises"
import path from "node:path"

export const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR || "data/uploads")
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

const ALLOWED_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
])

const MIME_BY_EXTENSION = new Map(
  [...ALLOWED_TYPES.entries()].map(([mime, extension]) => [extension, mime])
)

export function extensionForMime(mime) {
  return ALLOWED_TYPES.get(mime) || null
}

export function matchesFileSignature(buffer, mime) {
  const bytes = new Uint8Array(buffer)
  const ascii = String.fromCharCode(...bytes.slice(0, 16))
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mime === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])
  if (mime === "image/gif") return ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")
  if (mime === "image/webp") return ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP"
  if (mime === "video/mp4") return ascii.slice(4, 8) === "ftyp"
  if (mime === "video/webm") return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3
  return false
}

export function mimeForFilename(filename) {
  return MIME_BY_EXTENSION.get(path.extname(filename).toLowerCase()) || "application/octet-stream"
}

export function safeUploadPath(filename) {
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp|gif|mp4|webm)$/.test(filename)) return null
  const resolved = path.resolve(UPLOAD_DIR, filename)
  return resolved.startsWith(`${UPLOAD_DIR}${path.sep}`) ? resolved : null
}

export async function ensureUploadDirectory() {
  await mkdir(UPLOAD_DIR, { recursive: true })
}
