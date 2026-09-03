import { db } from "@/lib/db"
import { getCurrentUser, requireUser } from "@/lib/auth"
import { error, handleRouteError, json, RequestError } from "@/lib/http"
import { serializePost } from "@/lib/posts"
import { assertSameOrigin } from "@/lib/security"
import { unlink } from "node:fs/promises"
import path from "node:path"
import { UPLOAD_DIR } from "@/lib/storage"

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser(request)
    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: { select: authorSelect },
        comments: {
          include: { author: { select: authorSelect } },
          orderBy: { createdAt: "asc" },
        },
        likes: currentUser ? { where: { userId: currentUser.id }, select: { userId: true } } : false,
        bookmarks: currentUser
          ? { where: { userId: currentUser.id }, select: { userId: true } }
          : false,
        _count: { select: { likes: true, comments: true } },
        publications: { orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }] },
      },
    })

    if (!post) return error("Không tìm thấy bài viết", 404)
    if (
      post.visibility !== "PUBLIC" &&
      currentUser?.id !== post.authorId &&
      currentUser?.role !== "ADMIN"
    ) {
      return error("Không tìm thấy bài viết", 404)
    }

    return json(serializePost(post, currentUser?.id))
  } catch (caught) {
    return handleRouteError("posts.detail", caught)
  }
}

export async function DELETE(request, { params }) {
  try {
    assertSameOrigin(request)
    const { id } = await params
    const user = await requireUser(request)
    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true, mediaAssets: { select: { filename: true } } },
    })

    if (!post) return error("Không tìm thấy bài viết", 404)
    if (post.authorId !== user.id && user.role !== "ADMIN") {
      throw new RequestError("Bạn không có quyền xóa bài viết này", 403)
    }

    await db.$transaction([
      db.post.delete({ where: { id } }),
      db.auditLog.create({
        data: {
          actorId: user.id,
          action: "post.delete",
          target: id,
          metadata: { ownerId: post.authorId },
        },
      }),
    ])
    await Promise.allSettled(
      post.mediaAssets.map((asset) => unlink(path.join(UPLOAD_DIR, asset.filename)))
    )

    return json({ success: true })
  } catch (caught) {
    return handleRouteError("posts.delete", caught)
  }
}
