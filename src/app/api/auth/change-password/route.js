import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { requireUser, setSessionCookie } from "@/lib/auth"
import { error, handleRouteError, json, readJson } from "@/lib/http"
import { assertSameOrigin, validatePassword } from "@/lib/security"

export async function POST(request) {
  try {
    assertSameOrigin(request)
    const user = await requireUser(request)
    const { currentPassword, newPassword } = await readJson(request, 4_096)
    validatePassword(newPassword)

    const stored = await db.user.findUnique({ where: { id: user.id }, select: { password: true } })
    if (!stored || !(await bcrypt.compare(String(currentPassword || ""), stored.password))) {
      return error("Mật khẩu hiện tại không chính xác", 400)
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 12),
        sessionVersion: { increment: 1 },
      },
    })
    await setSessionCookie(updated)
    return json({ success: true })
  } catch (caught) {
    return handleRouteError("auth.change-password", caught)
  }
}
