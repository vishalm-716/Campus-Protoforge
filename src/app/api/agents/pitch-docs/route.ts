import { json, jsonError, readJson, requireApiUser, isNextResponse, canAccessTeamApi } from "@/lib/api-helpers";
import { runDocsAgent } from "@/lib/agents/docs";

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<{ teamId: string }>(req);
  if (!body?.teamId) return jsonError("teamId required");
  if (!(await canAccessTeamApi(body.teamId, user))) return jsonError("Forbidden", 403);

  const result = await runDocsAgent({ teamId: body.teamId, actorId: user.id });
  return json({ docs: result.docs, engine: result.engine });
}
