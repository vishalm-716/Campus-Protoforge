import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const { searchParams } = new URL(req.url);
  const challengeId = searchParams.get("challengeId");
  const mine = searchParams.get("mine") === "1";

  const where: Record<string, unknown> = {};
  if (challengeId) where.challengeId = challengeId;
  if (mine) where.members = { some: { userId: user.id } };

  const teams = await prisma.team.findMany({
    where,
    include: {
      challenge: { select: { id: true, title: true, department: true } },
      track: { select: { id: true, level: true } },
      members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      mentor: { select: { id: true, name: true } },
      artefacts: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return json({ teams });
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<{ name: string; challengeId: string; prototypeTrackId?: string; memberIds?: string[] }>(req);
  if (!body?.name?.trim() || !body.challengeId) return jsonError("Team name and challenge are required");

  const challenge = await prisma.challenge.findUnique({ where: { id: body.challengeId }, include: { tracks: true } });
  if (!challenge) return jsonError("Challenge not found", 404);

  const trackId =
    body.prototypeTrackId ??
    (challenge.tracks.length === 1 ? challenge.tracks[0].id : undefined);
  if (!trackId) {
    return jsonError("This challenge has multiple or no prototype tracks — pick one explicitly", 400);
  }

  const team = await prisma.team.create({
    data: {
      name: body.name.trim(),
      challengeId: body.challengeId,
      prototypeTrackId: trackId,
      members: { create: [{ userId: user.id, role: "lead" }] },
    },
  });

  await logActivity({
    action: "team.create",
    summary: `Team "${team.name}" formed for ${challenge.title}`,
    actorName: user.name,
    teamId: team.id,
    challengeId: challenge.id,
  });

  return json({ team }, 201);
}
