import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse, requireApiRole } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity";
import type { RubricCriterion } from "@/lib/types";

export async function GET(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");

  const where: Record<string, unknown> = {};
  if (teamId) where.teamId = teamId;
  if (user.role === "faculty") where.facultyId = user.id;

  const feedbacks = await prisma.feedback.findMany({
    where,
    include: { team: { select: { name: true, challenge: { select: { title: true } } } }, faculty: { select: { name: true } }, milestone: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });
  return json({ feedbacks });
}

export async function POST(req: Request) {
  const user = await requireApiRole("faculty", "admin");
  if (isNextResponse(user)) return user;

  const body = await readJson<{ teamId: string; milestoneId?: string; rubricScores: RubricCriterion[]; comments?: string; finalised?: boolean }>(req);
  if (!body?.teamId || !Array.isArray(body.rubricScores)) return jsonError("teamId and rubricScores required");

  const feedback = await prisma.feedback.create({
    data: {
      teamId: body.teamId,
      milestoneId: body.milestoneId ?? null,
      facultyId: user.id,
      rubricScores: JSON.stringify(body.rubricScores),
      comments: body.comments ?? "",
      finalised: Boolean(body.finalised),
    },
  });

  await logActivity({
    action: "feedback.create",
    summary: `Feedback ${body.finalised ? "finalised" : "drafted"} for ${body.teamId}`,
    actorName: user.name,
    teamId: body.teamId,
  });

  return json({ feedback }, 201);
}

export async function PATCH(req: Request) {
  const user = await requireApiRole("faculty", "admin");
  if (isNextResponse(user)) return user;

  const body = await readJson<{ id: string; rubricScores?: RubricCriterion[]; comments?: string; finalised?: boolean }>(req);
  if (!body?.id) return jsonError("id required");

  const existing = await prisma.feedback.findUnique({ where: { id: body.id } });
  if (!existing) return jsonError("Not found", 404);

  const data: Record<string, unknown> = {};
  if (body.rubricScores !== undefined) data.rubricScores = JSON.stringify(body.rubricScores);
  if (body.comments !== undefined) data.comments = body.comments;
  if (body.finalised !== undefined) data.finalised = body.finalised;

  const feedback = await prisma.feedback.update({ where: { id: body.id }, data });

  await logActivity({
    action: body.finalised ? "feedback.finalise" : "feedback.update",
    summary: body.finalised ? `Feedback finalised` : `Feedback updated`,
    actorName: user.name,
    teamId: existing.teamId,
  });

  return json({ feedback });
}
