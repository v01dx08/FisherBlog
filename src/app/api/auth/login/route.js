import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { setSessionCookie } from "@/lib/auth";
import { error, getClientIp, handleRouteError, json, readJson, RequestError } from "@/lib/http";
import { assertSameOrigin, normalizeIdentity } from "@/lib/security";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function throttleKey(request, identity) {
  return createHash("sha256")
    .update(`${getClientIp(request)}:${identity}`)
    .digest("hex");
}

async function assertNotThrottled(key) {
  const throttle = await db.loginThrottle.findUnique({ where: { key } });
  if (!throttle) return;

  if (throttle.blockedUntil && throttle.blockedUntil > new Date()) {
    throw new RequestError("Đăng nhập tạm khóa. Vui lòng thử lại sau 15 phút", 429);
  }

  if (Date.now() - throttle.updatedAt.getTime() > WINDOW_MS) {
    await db.loginThrottle.delete({ where: { key } });
  }
}

async function recordFailure(key) {
  const existing = await db.loginThrottle.findUnique({ where: { key } });
  const attempts = Date.now() - (existing?.updatedAt?.getTime() || 0) > WINDOW_MS
    ? 1
    : (existing?.attempts || 0) + 1;

  await db.loginThrottle.upsert({
    where: { key },
    update: {
      attempts,
      blockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + WINDOW_MS) : null,
    },
    create: {
      key,
      attempts,
      blockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + WINDOW_MS) : null,
    },
  });
}

export async function POST(req) {
  try {
    assertSameOrigin(req);
    const { username, password } = await readJson(req, 4_096);
    const identity = normalizeIdentity(username);

    if (!identity || !password) return error("Vui lòng nhập tên đăng nhập và mật khẩu", 400);

    const key = throttleKey(req, identity);
    await assertNotThrottled(key);

    const user = await db.user.findFirst({
      where: {
        OR: [{ usernameNormalized: identity }, { emailNormalized: identity }],
      },
    });

    const isMatch = user ? await bcrypt.compare(String(password), user.password) : false;
    if (!user || !isMatch) {
      await recordFailure(key);
      return error("Tài khoản hoặc mật khẩu không chính xác", 401);
    }

    if (user.status !== "ACTIVE") return error("Tài khoản đã bị tạm khóa", 403);

    await db.loginThrottle.deleteMany({ where: { key } });
    await setSessionCookie(user);

    return json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    return handleRouteError("auth.login", error);
  }
}
