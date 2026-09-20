import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, requireApiRole, isNextResponse } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const assets = await prisma.learningAsset.findMany({
    include: {
      challenge: { select: { id: true, title: true, department: true, domainTags: true } },
      publishedByUser: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return json({ assets });
}

export async function POST(req: Request) {
  const user = await requireApiRole("faculty", "admin");
  if (isNextResponse(user)) return user;

  const body = await readJson<{ teamId: string; title?: string; summary?: string; tags?: string[] }>(req);
  if (!body?.teamId) return jsonError("teamId required");

  const team = await prisma.team.findUnique({
    where: { id: body.teamId },
    include: { challenge: true, track: true },
  });
  if (!team) return jsonError("Team not found", 404);

  const summary =
    body.summary ??
    (team.pitchDocs
      ? (() => {
          try {
            const docs = JSON.parse(team.pitchDocs) as { onePageSummary?: { problem?: string; solution?: string } };
            return `${docs.onePageSummary?.problem ?? ""} ${docs.onePageSummary?.solution ?? ""}`.trim();
          } catch {
            return "";
          }
        })()
      : team.challenge.rawDescription.slice(0, 300));

  const asset = await prisma.learningAsset.create({
    data: {
      teamId: team.id,
      challengeId: team.challengeId,
      title: body.title ?? `${team.name} — ${team.challenge.title}`,
      summary,
      tags: JSON.stringify([...JSON.parse(team.challenge.domainTags || "[]"), team.track?.level ?? ""].filter(Boolean)),
      publishedBy: user.id,
    },
  });

  await prisma.challenge.update({ where: { id: team.challengeId }, data: { status: "completed" } }).catch(() => {});

  await logActivity({
    action: "asset.publish",
    summary: `Learning asset published: ${asset.title}`,
    actorName: user.name,
    teamId: team.id,
    challengeId: team.challengeId,
  });

  return json({ asset }, 201);
}
