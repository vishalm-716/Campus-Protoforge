import { cookies } from "next/headers";
import { json } from "@/lib/api-helpers";
import { SESSION_COOKIE } from "@/lib/crypto";

export async function POST() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return json({ ok: true });
}
