import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

function computeSessionToken(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? "";
  return createHmac("sha256", secret)
    .update(process.env.ADMIN_PASSWORD ?? "")
    .digest("hex");
}

export function createSessionToken(): string {
  return computeSessionToken();
}

export async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin-session");
  if (!session?.value) return false;
  const expected = computeSessionToken();
  if (session.value.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(session.value), Buffer.from(expected));
  } catch {
    return false;
  }
}
