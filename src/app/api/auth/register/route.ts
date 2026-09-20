import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { json, jsonError, readJson } from "@/lib/api-helpers";

interface Body {
  name: string;
  email: string;
  password: string;
  role: "student" | "faculty" | "admin";
  department?: string;
  year?: number;
  skills?: string[];
  preferredStack?: string;
}

export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  if (!body?.name || !body.email || !body.password) return jsonError("Name, email and password are required");
  if (body.password.length < 6) return jsonError("Password must be at least 6 characters");
  const role = body.role || "student";
  if (!["student", "faculty", "admin"].includes(role)) return jsonError("Invalid role");

  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (existing) return jsonError("An account with this email already exists", 409);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: hashPassword(body.password),
      role,
      department: body.department ?? null,
      year: role === "student" ? body.year ?? 2 : null,
      skills: JSON.stringify(body.skills ?? []),
      preferredStack: body.preferredStack ?? null,
    },
  });

  return json({ id: user.id, email: user.email, role: user.role });
}
