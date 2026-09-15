import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { assertSameOrigin } from "@/lib/security"
import { enforceRateLimit } from "@/lib/rate-limit"
import { handleRouteError, json, readJson } from "@/lib/http"
import { validateFeedbackInput } from "@/lib/feedback"

export async function POST(request) {
  try {
    assertSameOrigin(request)
    const user = await getCurrentUser(request)
    await enforceRateLimit(request, {
      scope: "feedback.create",
      actorId: user?.id,
      limit: user ? 12 : 5,
      windowMs: 60 * 60 * 1000,
    })

    const input = validateFeedbackInput(await readJson(request, 8_192))
    const feedback = await db.feedback.create({
      data: {
        ...input,
        userId: user?.id || null,
      },
      select: {
        id: true,
        category: true,
        priority: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    })

    return json(feedback, 201)
  } catch (caught) {
    return handleRouteError("feedback.create", caught, request)
  }
}
