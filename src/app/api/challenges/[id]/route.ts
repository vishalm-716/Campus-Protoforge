import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, department: true, role: true, title: true } },
      tracks: { include: { milestones: { orderBy: { orderIndex: "asc" } } } },
      teams: { include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } } } },
      learningAssets: true,
    },
  });
  if (!challenge) return jsonError("Challenge not found", 404);
  return json({ challenge });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { id } = await params;

  const challenge = await prisma.challenge.findUnique({ where: { id } });
  if (!challenge) return jsonError("Challenge not found", 404);
  if (challenge.ownerId !== user.id && user.role !== "admin") return jsonError("Forbidden", 403);

  const body = await readJson<{ title?: string; rawDescription?: string; domainTags?: string[]; courseTag?: string; department?: string; difficulty?: string; expectedImpact?: string; visibility?: string; status?: string; briefStatus?: string; kind?: string }>(req);
  if (!body) return jsonError("Invalid body");

  const updated = await prisma.challenge.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.rawDescription !== undefined ? { rawDescription: body.rawDescription } : {}),
      ...(body.domainTags !== undefined ? { domainTags: JSON.stringify(body.domainTags) } : {}),
      ...(body.courseTag !== undefined ? { courseTag: body.courseTag } : {}),
      ...(body.department !== undefined ? { department: body.department } : {}),
      ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
      ...(body.expectedImpact !== undefined ? { expectedImpact: body.expectedImpact } : {}),
      ...(body.visibility !== undefined ? { visibility: body.visibility } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.briefStatus !== undefined ? { briefStatus: body.briefStatus } : {}),
      ...(body.kind !== undefined ? { kind: body.kind } : {}),
    },
  });

  await logActivity({
    action: "challenge.update",
    summary: `Challenge updated: ${updated.title}`,
    actorName: user.name,
    challengeId: updated.id,
  });

  return json({ challenge: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { id } = await params;
  const challenge = await prisma.challenge.findUnique({ where: { id } });
  if (!challenge) return jsonError("Challenge not found", 404);
  if (challenge.ownerId !== user.id && user.role !== "admin") return jsonError("Forbidden", 403);
  await prisma.challenge.delete({ where: { id } });
  return json({ ok: true });
}
