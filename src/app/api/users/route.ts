import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const role = searchParams.get("role") ?? "";

  const users = await prisma.user.findMany({
    where: {
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
      ...(role ? { role } : {}),
    },
    select: { id: true, name: true, email: true, role: true, department: true, year: true, avatar: true, skills: true },
    take: 20,
  });
  return json({ users });
}

export async function PATCH(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<{ name?: string; department?: string; year?: number; skills?: string[]; preferredStack?: string; title?: string; bio?: string }>(req);
  if (!body) return jsonError("Invalid body");

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.department !== undefined ? { department: body.department } : {}),
      ...(body.year !== undefined ? { year: body.year } : {}),
      ...(body.skills !== undefined ? { skills: JSON.stringify(body.skills) } : {}),
      ...(body.preferredStack !== undefined ? { preferredStack: body.preferredStack } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.bio !== undefined ? { bio: body.bio } : {}),
    },
  });
  return json({ user: { id: updated.id, name: updated.name } });
}
