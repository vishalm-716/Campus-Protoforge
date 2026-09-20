import { prisma } from "@/lib/db";
import { verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/crypto";
import { json, jsonError, readJson } from "@/lib/api-helpers";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await readJson<{ email: string; password: string }>(req);
  if (!body?.email || !body.password) return jsonError("Email and password are required");

  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    return jsonError("Invalid email or password", 401);
  }

  const token = createSessionToken(user.id, user.role);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return json({ id: user.id, name: user.name, role: user.role });
}
