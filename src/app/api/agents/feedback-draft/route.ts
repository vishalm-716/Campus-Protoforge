import { json, jsonError, readJson, requireApiRole, isNextResponse } from "@/lib/api-helpers";
import { runFeedbackAgent } from "@/lib/agents/feedback";

export async function POST(req: Request) {
  const user = await requireApiRole("faculty", "admin");
  if (isNextResponse(user)) return user;

  const body = await readJson<{ teamId: string; milestoneId?: string }>(req);
  if (!body?.teamId) return jsonError("teamId required");

  const result = await runFeedbackAgent({ teamId: body.teamId, milestoneId: body.milestoneId, facultyId: user.id });
  return json({ feedback: result.feedback, draft: result.draft, engine: result.engine });
}
