import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse, canAccessTeamApi } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity";
import { parseJson } from "@/lib/utils";
import type { ChecklistItem } from "@/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { id } = await params;

  const milestone = await prisma.milestone.findUnique({
    where: { id },
    include: { prototypeTrack: { include: { challenge: true } } },
  });
  if (!milestone) return jsonError("Milestone not found", 404);

  const challengeId = milestone.prototypeTrack.challengeId;
  const team = await prisma.team.findFirst({ where: { prototypeTrackId: milestone.prototypeTrackId } });
  const teamId = team?.id;

  // Permission: team members, mentor, challenge owner, or any faculty
  if (teamId) {
    if (!(await canAccessTeamApi(teamId, user)) && user.role !== "faculty") return jsonError("Forbidden", 403);
  }

  const body = await readJson<{ status?: string; notes?: string; checklist?: ChecklistItem[]; toggleChecklistIndex?: number; dueDate?: string | null }>(req);
  if (!body) return jsonError("Invalid body");

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!["todo", "in_progress", "done"].includes(body.status)) return jsonError("Invalid status");
    data.status = body.status;
  }
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.checklist !== undefined) data.checklistItems = JSON.stringify(body.checklist);
  if (body.toggleChecklistIndex !== undefined) {
    const items = parseJson<ChecklistItem[]>(milestone.checklistItems, []);
    if (items[body.toggleChecklistIndex]) items[body.toggleChecklistIndex].done = !items[body.toggleChecklistIndex].done;
    data.checklistItems = JSON.stringify(items);
  }

  const updated = await prisma.milestone.update({ where: { id }, data });

  if (teamId) {
    const summary =
      body.status !== undefined
        ? `${milestone.title} → ${body.status.replace("_", " ")}`
        : body.notes !== undefined
          ? `Notes updated on ${milestone.title}`
          : `Checklist updated on ${milestone.title}`;
    await logActivity({ action: "milestone.update", summary, actorName: user.name, teamId, challengeId });
  }

  return json({ milestone: updated });
}
