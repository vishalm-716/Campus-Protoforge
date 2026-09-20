import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse, canAccessTeamApi } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  const registry = searchParams.get("registry") === "1";

  if (registry) {
    const apis = await prisma.externalApi.findMany({
      where: { isPublishedToRegistry: true, registryStatus: "approved" },
      include: { team: { select: { name: true, challenge: { select: { title: true } } } }, testCases: { select: { id: true } } },
      orderBy: { usageCount: "desc" },
    });
    return json({ apis });
  }

  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  if (!teamId) return jsonError("teamId required");
  if (!(await canAccessTeamApi(teamId, user))) return jsonError("Forbidden", 403);

  const apis = await prisma.externalApi.findMany({
    where: { teamId },
    include: { testCases: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
  return json({ apis });
}

interface EndpointExample {
  method: string;
  path: string;
  description?: string;
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<{
    teamId: string;
    name: string;
    baseUrl: string;
    description?: string;
    authType?: string;
    authConfig?: Record<string, string>;
    exampleEndpoints?: EndpointExample[];
    category?: string;
    tags?: string[];
    docsUrl?: string;
    repoUrl?: string;
    submitToRegistry?: boolean;
  }>(req);

  if (!body?.teamId || !body.name?.trim() || !body.baseUrl?.trim()) return jsonError("teamId, name and baseUrl are required");
  if (!(await canAccessTeamApi(body.teamId, user))) return jsonError("Forbidden", 403);

  let baseUrl = body.baseUrl.trim();
  if (!/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`;

  const api = await prisma.externalApi.create({
    data: {
      teamId: body.teamId,
      name: body.name.trim(),
      baseUrl,
      description: body.description ?? "",
      authType: body.authType ?? "none",
      authConfig: JSON.stringify(body.authConfig ?? {}),
      exampleEndpoints: JSON.stringify(body.exampleEndpoints ?? []),
      category: body.category ?? "utilities",
      tags: JSON.stringify(body.tags ?? []),
      docsUrl: body.docsUrl ?? null,
      repoUrl: body.repoUrl ?? null,
      isPublishedToRegistry: Boolean(body.submitToRegistry),
      registryStatus: body.submitToRegistry ? "pending" : "draft",
    },
  });

  await logActivity({
    action: "api.register",
    summary: `Registered API "${api.name}" (${api.baseUrl})`,
    actorName: user.name,
    teamId: body.teamId,
  });

  return json({ api }, 201);
}

export async function PATCH(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<{
    id: string;
    name?: string;
    description?: string;
    baseUrl?: string;
    authType?: string;
    authConfig?: Record<string, string>;
    exampleEndpoints?: EndpointExample[];
    category?: string;
    tags?: string[];
    docsUrl?: string;
    repoUrl?: string;
    submitToRegistry?: boolean;
  }>(req);
  if (!body?.id) return jsonError("id required");

  const api = await prisma.externalApi.findUnique({ where: { id: body.id } });
  if (!api) return jsonError("Not found", 404);
  if (api.teamId && !(await canAccessTeamApi(api.teamId, user))) return jsonError("Forbidden", 403);

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.baseUrl !== undefined) data.baseUrl = body.baseUrl;
  if (body.authType !== undefined) data.authType = body.authType;
  if (body.authConfig !== undefined) data.authConfig = JSON.stringify(body.authConfig);
  if (body.exampleEndpoints !== undefined) data.exampleEndpoints = JSON.stringify(body.exampleEndpoints);
  if (body.category !== undefined) data.category = body.category;
  if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);
  if (body.docsUrl !== undefined) data.docsUrl = body.docsUrl;
  if (body.repoUrl !== undefined) data.repoUrl = body.repoUrl;
  if (body.submitToRegistry) {
    data.isPublishedToRegistry = true;
    data.registryStatus = "pending";
  }

  const updated = await prisma.externalApi.update({ where: { id: body.id }, data });
  return json({ api: updated });
}

export async function DELETE(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required");

  const api = await prisma.externalApi.findUnique({ where: { id } });
  if (!api) return jsonError("Not found", 404);
  if (api.teamId && !(await canAccessTeamApi(api.teamId, user))) return jsonError("Forbidden", 403);

  await prisma.externalApi.delete({ where: { id } });
  return json({ ok: true });
}
