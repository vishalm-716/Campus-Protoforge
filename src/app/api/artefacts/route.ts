import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse, canAccessTeamApi } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) return jsonError("teamId required");
  if (!(await canAccessTeamApi(teamId, user))) return jsonError("Forbidden", 403);

  const artefacts = await prisma.artefact.findMany({
    where: { teamId },
    include: { uploader: { select: { name: true } }, milestone: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });
  return json({ artefacts });
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<{ teamId: string; milestoneId?: string; type?: string; url: string; shortDescription?: string }>(req);
  if (!body?.teamId || !body.url?.trim()) return jsonError("teamId and url are required");
  if (!(await canAccessTeamApi(body.teamId, user))) return jsonError("Forbidden", 403);

  let url = body.url.trim();
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) url = `https://${url}`;

  const artefact = await prisma.artefact.create({
    data: {
      teamId: body.teamId,
      milestoneId: body.milestoneId ?? null,
      type: body.type ?? "other",
      url,
      shortDescription: body.shortDescription ?? "",
      uploaderId: user.id,
    },
  });

  await logActivity({
    action: "artefact.upload",
    summary: `${artefact.type.replace("_", " ")} added: ${artefact.shortDescription || artefact.url}`,
    actorName: user.name,
    teamId: body.teamId,
  });

  return json({ artefact }, 201);
}

export async function DELETE(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required");

  const artefact = await prisma.artefact.findUnique({ where: { id } });
  if (!artefact) return jsonError("Not found", 404);
  if (!(await canAccessTeamApi(artefact.teamId, user))) return jsonError("Forbidden", 403);

  await prisma.artefact.delete({ where: { id } });
  return json({ ok: true });
}
