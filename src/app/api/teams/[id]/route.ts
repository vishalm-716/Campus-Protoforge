import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse, canAccessTeamApi } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      challenge: true,
      track: { include: { milestones: { orderBy: { orderIndex: "asc" } } } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true, department: true, year: true, skills: true } } } },
      mentor: { select: { id: true, name: true, email: true } },
      artefacts: { include: { uploader: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      feedbacks: { include: { faculty: { select: { name: true } }, milestone: { select: { title: true } } }, orderBy: { createdAt: "desc" } },
      externalApis: { include: { testCases: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!team) return jsonError("Team not found", 404);

  const allowed = user.role === "admin" || team.members.some((m) => m.userId === user.id) || team.mentorId === user.id || team.challenge.ownerId === user.id;
  if (!allowed) return jsonError("Forbidden", 403);

  return json({ team });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { id } = await params;

  if (!(await canAccessTeamApi(id, user))) return jsonError("Forbidden", 403);

  const body = await readJson<{ name?: string; notes?: string; mentorId?: string | null; addMemberIds?: string[]; removeMemberIds?: string[]; prototypeTrackId?: string }>(req);
  if (!body) return jsonError("Invalid body");

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.mentorId !== undefined) data.mentorId = body.mentorId || null;
  if (body.prototypeTrackId !== undefined) data.prototypeTrackId = body.prototypeTrackId;

  const team = await prisma.team.update({ where: { id }, data });

  if (body.addMemberIds?.length) {
    for (const uid of body.addMemberIds) {
      await prisma.teamMember.createMany({ data: { teamId: id, userId: uid } }).catch(() => {});
    }
    const added = await prisma.user.findMany({ where: { id: { in: body.addMemberIds } } });
    for (const u of added) {
      await logActivity({ action: "team.member_join", summary: `${u.name} joined ${team.name}`, actorName: u.name, teamId: team.id, challengeId: team.challengeId });
    }
  }
  if (body.removeMemberIds?.length) {
    await prisma.teamMember.deleteMany({ where: { teamId: id, userId: { in: body.removeMemberIds } } });
  }

  return json({ team });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { id } = await params;
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return jsonError("Team not found", 404);
  if (user.role !== "admin" && team.mentorId !== user.id) return jsonError("Only the mentor or an admin can disband a team", 403);
  await prisma.team.delete({ where: { id } });
  return json({ ok: true });
}
