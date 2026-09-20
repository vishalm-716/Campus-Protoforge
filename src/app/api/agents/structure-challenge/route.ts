import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse } from "@/lib/api-helpers";
import { runStructureAgent } from "@/lib/agents/structure";

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<{ challengeId: string }>(req);
  if (!body?.challengeId) return jsonError("challengeId required");

  const challenge = await prisma.challenge.findUnique({ where: { id: body.challengeId } });
  if (!challenge) return jsonError("Challenge not found", 404);

  // Owner, faculty, and admins may (re)run structuring. Faculty review-first:
  // output is always a draft the owner approves.
  const mayStructure = challenge.ownerId === user.id || user.role === "faculty" || user.role === "admin";
  if (!mayStructure) return jsonError("Forbidden", 403);

  const result = await runStructureAgent(challenge, user.id);
  return json(result);
}
