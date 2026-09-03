import { getCurrentUser } from "@/lib/auth";
import { json } from "@/lib/http";

export async function GET() {
  try {
    return json({ user: await getCurrentUser() });
  } catch {
    return json({ user: null });
  }
}
