import { db } from "@/lib/db"
import { error, handleRouteError, json } from "@/lib/http"
import { hashPostProofPayload } from "@/lib/posts"

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const post = await db.post.findUnique({
      where: { id },
      select: {
        id: true,
        proofHash: true,
        proofVersion: true,
        proofPayload: true,
        proofIssuedAt: true,
        createdAt: true,
        visibility: true,
        author: { select: { username: true, displayName: true } },
        publications: { orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }] },
      },
    })
    if (!post || post.visibility !== "PUBLIC") return error("Không tìm thấy chứng nhận", 404)

    const independentlyVerified = post.proofPayload
      ? hashPostProofPayload(post.proofPayload) === post.proofHash
      : null
    return json({
      postId: post.id,
      sha256: post.proofHash,
      issuedAt: post.proofIssuedAt,
      publishedAt: post.createdAt,
      author: post.author.displayName || post.author.username,
      version: post.proofVersion,
      payload: post.proofPayload,
      independentlyVerified,
      verification: `Nhật ký ngày đi câu Content Proof v${post.proofVersion}`,
      publications: post.publications,
    })
  } catch (caught) {
    return handleRouteError("posts.proof", caught, request)
  }
}
