import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse, canAccessTeamApi } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity";

interface TestBody {
  teamId: string;
  apiId?: string;
  milestoneId?: string;
  caseId?: string; // re-run an existing case
  name?: string;
  method?: string;
  url: string; // absolute or path — combined with api.baseUrl when apiId is given
  headers?: Record<string, string>;
  body?: string | null;
  expectedStatus?: number;
  save?: boolean;
}

async function executeRequest(method: string, url: string, headers: Record<string, string>, body: string | null) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: ["GET", "HEAD"].includes(method) || !body ? undefined : body,
      signal: AbortSignal.timeout(15_000),
    });
    const durationMs = Date.now() - started;
    const text = await res.text().catch(() => "");
    let pretty: string;
    try {
      pretty = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      pretty = text.slice(0, 2000);
    }
    return { status: res.status, durationMs, body: pretty.slice(0, 4000) };
  } catch (err) {
    return { status: 0, durationMs: Date.now() - started, body: `Request failed: ${(err as Error).message}` };
  }
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const input = await readJson<TestBody>(req);
  if (!input?.teamId || !input.url) return jsonError("teamId and url are required");
  if (!(await canAccessTeamApi(input.teamId, user))) return jsonError("Forbidden", 403);

  let url = input.url.trim();
  if (input.apiId) {
    const api = await prisma.externalApi.findUnique({ where: { id: input.apiId } });
    if (api && !/^https?:\/\//i.test(url)) url = `${api.baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  }
  if (!/^https?:\/\//i.test(url)) return jsonError("URL must be absolute or paired with a registered API");

  const method = (input.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = { Accept: "application/json", ...(input.headers ?? {}) };

  const outcome = await executeRequest(method, url, headers, input.body ?? null);
  const expectedStatus = input.expectedStatus ?? 200;
  const passed = outcome.status === expectedStatus || (outcome.status >= 200 && outcome.status < 300 && expectedStatus === 200);

  let testCase = null;
  if (input.save && passed) {
    testCase = await prisma.apiTestCase.create({
      data: {
        apiId: input.apiId ?? null,
        teamId: input.teamId,
        milestoneId: input.milestoneId ?? null,
        name: input.name ?? `${method} ${url.slice(0, 60)}`,
        method,
        path: url,
        headers: JSON.stringify(input.headers ?? {}),
        body: input.body ?? null,
        expectedStatus,
        lastStatus: outcome.status,
        lastDurationMs: outcome.durationMs,
        lastRunAt: new Date(),
        lastResponse: outcome.body.slice(0, 2000),
        consecutiveFailures: 0,
      },
    });
  } else if (input.caseId) {
    await prisma.apiTestCase.update({
      where: { id: input.caseId },
      data: {
        lastStatus: outcome.status,
        lastDurationMs: outcome.durationMs,
        lastRunAt: new Date(),
        lastResponse: outcome.body.slice(0, 2000),
        consecutiveFailures: passed ? 0 : { increment: 1 },
      },
    });
  }

  if (input.apiId) {
    await prisma.externalApi.update({ where: { id: input.apiId }, data: { usageCount: { increment: 1 } } }).catch(() => {});
  }

  await logActivity({
    action: "api.test",
    summary: `${method} ${url} → ${outcome.status} (${outcome.durationMs}ms)${passed ? " ✓" : " ✗"}`,
    actorName: user.name,
    teamId: input.teamId,
  });

  return json({ ...outcome, passed, testCaseId: testCase?.id ?? null });
}

export async function GET(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) return jsonError("teamId required");
  if (!(await canAccessTeamApi(teamId, user))) return jsonError("Forbidden", 403);

  const cases = await prisma.apiTestCase.findMany({
    where: { teamId },
    include: { api: { select: { name: true } }, milestone: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });
  return json({ cases });
}

export async function DELETE(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required");

  const testCase = await prisma.apiTestCase.findUnique({ where: { id } });
  if (!testCase) return jsonError("Not found", 404);
  if (!(await canAccessTeamApi(testCase.teamId ?? "", user))) return jsonError("Forbidden", 403);

  await prisma.apiTestCase.delete({ where: { id } });
  return json({ ok: true });
}
