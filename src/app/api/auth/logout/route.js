import { clearSessionCookie } from "@/lib/auth";
import { handleRouteError, json } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    await clearSessionCookie();
    return json({ success: true, message: "Đã đăng xuất thành công" });
  } catch (error) {
    return handleRouteError("auth.logout", error);
  }
}
