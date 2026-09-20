import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse, canAccessTeamApi } from "@/lib/api-helpers";
import { encryptSecret, maskSecret, decryptSecret } from "@/lib/crypto";
import { providerInfo } from "@/lib/llm/providers";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) return jsonError("teamId required");
  if (!(await canAccessTeamApi(teamId, user))) return jsonError("Forbidden", 403);

  const providers = await prisma.llmProvider.findMany({ where: { teamId }, orderBy: { createdAt: "desc" } });
  // Never return raw or decrypted keys — only a masked hint.
  return json({
    providers: providers.map((p) => ({
      id: p.id,
      provider: p.provider,
      label: p.label,
      model: p.model,
      agentScope: p.agentScope,
      keyMasked: maskSecret(decryptSecret(p.apiKeyEnc)),
      createdAt: p.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<{ teamId: string; provider: string; label?: string; apiKey: string; model?: string; agentScope?: string }>(req);
  if (!body?.teamId || !body.provider || !body.apiKey?.trim()) return jsonError("teamId, provider and apiKey are required");
  if (!(await canAccessTeamApi(body.teamId, user))) return jsonError("Forbidden", 403);

  const info = providerInfo(body.provider);
  if (!info) return jsonError("Unknown provider");

  const provider = await prisma.llmProvider.create({
    data: {
      teamId: body.teamId,
      provider: body.provider,
      label: body.label ?? "",
      apiKeyEnc: encryptSecret(body.apiKey.trim()),
      model: body.model?.trim() || info.defaultModel,
      agentScope: body.agentScope ?? "all",
    },
  });

  await logActivity({ action: "provider.add", summary: `AI provider configured: ${provider.provider} (${provider.model})`, actorName: user.name, teamId: body.teamId });

  return json({ provider: { id: provider.id, provider: provider.provider, model: provider.model, agentScope: provider.agentScope } }, 201);
}

export async function DELETE(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required");

  const provider = await prisma.llmProvider.findUnique({ where: { id } });
  if (!provider) return jsonError("Not found", 404);
  if (provider.teamId && !(await canAccessTeamApi(provider.teamId, user))) return jsonError("Forbidden", 403);

  await prisma.llmProvider.delete({ where: { id } });
  return json({ ok: true });
}
