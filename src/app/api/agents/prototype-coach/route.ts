import { json, jsonError, readJson, requireApiUser, isNextResponse, canAccessTeamApi } from "@/lib/api-helpers";
import { runCoachAgent } from "@/lib/agents/coach";
import { logActivity } from "@/lib/activity";

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<{ teamId: string; milestoneId?: string; question?: string }>(req);
  if (!body?.teamId) return jsonError("teamId required");
  if (!(await canAccessTeamApi(body.teamId, user))) return jsonError("Forbidden", 403);

  const result = await runCoachAgent({
    teamId: body.teamId,
    milestoneId: body.milestoneId,
    question: body.question,
    actorId: user.id,
  });

  if (body.question) {
    await logActivity({ action: "coach.question", summary: `Asked the coach: ${body.question.slice(0, 80)}`, actorName: user.name, teamId: body.teamId });
  }

  return json(result);
}
