import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiRole, isNextResponse } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireApiRole("admin");
  if (isNextResponse(user)) return user;

  let configs = await prisma.agentConfig.findMany({ orderBy: { agentName: "asc" } });
  if (!configs.length) {
    const names = ["Idea Structurer", "Track Generator", "Prototype Coach", "Feedback Agent", "Docs & Pitch", "Retention Radar"];
    await prisma.agentConfig.createMany({ data: names.map((n) => ({ agentName: n })) });
    configs = await prisma.agentConfig.findMany({ orderBy: { agentName: "asc" } });
  }
  return json({ configs });
}

export async function PATCH(req: Request) {
  const user = await requireApiRole("admin");
  if (isNextResponse(user)) return user;

  const body = await readJson<{ agentName: string; enabled?: boolean; maxAutonomy?: string; systemPrompt?: string }>(req);
  if (!body?.agentName) return jsonError("agentName required");
  if (body.maxAutonomy && !["suggest", "act_with_review", "act"].includes(body.maxAutonomy)) return jsonError("Invalid autonomy level");

  const config = await prisma.agentConfig.upsert({
    where: { agentName: body.agentName },
    update: {
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
      ...(body.maxAutonomy !== undefined ? { maxAutonomy: body.maxAutonomy } : {}),
      ...(body.systemPrompt !== undefined ? { systemPrompt: body.systemPrompt } : {}),
    },
    create: { agentName: body.agentName },
  });
  return json({ config });
}
