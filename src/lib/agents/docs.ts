import { prisma } from "../db";
import { llmComplete } from "../llm/client";
import { extractJson } from "../llm/json";
import { logAgent } from "../activity";
import { parseJson } from "../utils";
import type { PitchDocs } from "../types";

export async function runDocsAgent(params: { teamId: string; actorId?: string | null }) {
  const team = await prisma.team.findUniqueOrThrow({
    where: { id: params.teamId },
    include: {
      challenge: true,
      track: { include: { milestones: { orderBy: { orderIndex: "asc" } } } },
      artefacts: true,
      externalApis: true,
      members: { include: { user: true } },
    },
  });

  const doneCount = team.track?.milestones.filter((m) => m.status === "done").length ?? 0;
  const totalCount = team.track?.milestones.length ?? 0;

  const apiDetails = team.externalApis
    .map((a) => {
      const endpoints = parseJson<{ method: string; path: string; description?: string }[]>(a.exampleEndpoints, []);
      return `${a.name} — ${a.baseUrl} (auth: ${a.authType})${endpoints.length ? `; endpoints: ${endpoints.map((e) => `${e.method} ${a.baseUrl}${e.path} — ${e.description ?? ""}`).join(" | ")}` : ""}`;
    })
    .join("\n") || "none";

  const context = `Challenge: ${team.challenge.title}
Brief: ${(team.challenge.structuredBrief ?? team.challenge.rawDescription).slice(0, 600)}
Track: ${doneCount}/${totalCount} milestones done. Level: ${team.track?.level ?? "?"}
Artefacts: ${team.artefacts.map((a) => `${a.type}: ${a.shortDescription || a.url}`).join("; ") || "none yet"}
Team APIs:
${apiDetails}`;

  const system = `You are the Documentation & Pitch Agent for Campus ProtoForge.
Reply with ONLY JSON: { "readmeOutline": string[], "onePageSummary": {"problem","solution","techStack"(string[]),"impact"}, "pitchScript": string[] }.
If the team registered external APIs, the README outline MUST include a section showing example integration snippets (endpoints, auth, error handling) for THEIR APIs.`;

  const { result, config } = await llmComplete("docs", [
    { role: "system", content: system },
    { role: "user", content: context },
  ], { teamId: team.id });

  let docs: PitchDocs | null = result ? extractJson<PitchDocs>(result.text) : null;
  if (!docs || !docs.onePageSummary) {
    const api = team.externalApis[0];
    const endpoints = api ? parseJson<{ method: string; path: string; description?: string }[]>(api.exampleEndpoints, []) : [];
    docs = {
      readmeOutline: [
        `# ${team.name} — ${team.challenge.title}`,
        "",
        "## Problem",
        (team.challenge.structuredBrief ?? team.challenge.rawDescription).slice(0, 300),
        "",
        "## Solution",
        `A ${team.track?.level ?? "practical"}-level prototype that addresses the challenge via ${team.challenge.domainTags ? "the team's chosen stack" : "an iterative build"}.`,
        "",
        "## Tech stack",
        ...(parseJson<string[]>(team.challenge.domainTags, []).length ? [`- Domains: ${parseJson<string[]>(team.challenge.domainTags, []).join(", ")}`] : []),
        `- Track level: ${team.track?.level ?? "intermediate"}`,
        "",
        ...(api
          ? [
              `## Integrating ${api.name}`,
              `Base URL: \`${api.baseUrl}\` (auth: ${api.authType})`,
              "",
              "```js",
              `const res = await fetch("${api.baseUrl}${endpoints[0]?.path ?? "/endpoint"}", {`,
              api.authType === "api_key" ? '  headers: { "x-api-key": process.env.MY_API_KEY },' : api.authType === "bearer" ? "  headers: { Authorization: `Bearer ${token}` }," : "",
              "});",
              'if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);',
              "const data = await res.json();",
              "```",
              "",
              "### Error handling",
              "- Timeout after 10s and show a retry button",
              "- Fallback to cached data when the API is down",
            ]
          : ["## Integrations", "No external APIs registered yet — add them in the API Lab."]),
        "",
        "## Run it",
        "1. Clone the repo",
        "2. Install deps",
        "3. Set your API keys in `.env`",
        "4. `npm run dev`",
      ],
      onePageSummary: {
        problem: (team.challenge.structuredBrief ?? team.challenge.rawDescription).slice(0, 220),
        solution: `Team ${team.name}'s prototype tackles this with a working MVP built across ${totalCount} guided milestones (${doneCount} done).`,
        techStack: parseJson<string[]>(team.challenge.domainTags, []).slice(0, 6),
        impact: team.challenge.expectedImpact ?? "Makes a campus workflow measurably faster or smarter.",
      },
      pitchScript: [
        `[0:00] Hook: "${team.challenge.title}" — ${(team.challenge.structuredBrief ?? team.challenge.rawDescription).slice(0, 90)}…`,
        `[0:20] Why it matters: ${team.challenge.expectedImpact ?? "saves students/faculty real time every week"}.`,
        "[0:40] Live demo: walk through the core flow in the running prototype.",
        ...(api ? [`[1:10] Under the hood: we call ${api.name}${endpoints[0] ? ` at ${endpoints[0].method} ${endpoints[0].path}` : ""}, with graceful error handling.`] : []),
        `[1:40] Architecture: ${totalCount}-milestone roadmap; ${doneCount} complete.`,
        "[2:10] Impact & next steps: pilot with one department; add analytics.",
      ],
      generatedAt: new Date().toISOString(),
      source: "heuristic",
    };
  } else {
    docs.generatedAt = new Date().toISOString();
    docs.source = result ? `${config.provider}/${config.model}` : "heuristic";
  }

  await prisma.team.update({ where: { id: team.id }, data: { pitchDocs: JSON.stringify(docs) } });

  await logAgent({
    agentName: "Docs & Pitch",
    actionType: "pitch_docs_generated",
    relatedEntityType: "team",
    relatedEntityId: team.id,
    actorId: params.actorId,
    payload: { engine: docs.source },
  });

  return { docs, engine: docs.source ?? "heuristic" };
}
