import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse } from "@/lib/api-helpers";
import { runTrackAgent } from "@/lib/agents/track";

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<{ challengeId: string; studentUserId?: string; level?: string }>(req);
  if (!body?.challengeId) return jsonError("challengeId required");

  const challenge = await prisma.challenge.findUnique({ where: { id: body.challengeId } });
  if (!challenge) return jsonError("Challenge not found", 404);

  const result = await runTrackAgent(
    { challengeId: body.challengeId, studentUserId: body.studentUserId, overrides: { level: body.level as "beginner" | "intermediate" | "advanced" | undefined } },
    user.id,
  );
  return json({ track: result.track, engine: result.engine });
}
