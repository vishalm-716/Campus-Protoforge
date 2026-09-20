import type { Challenge, User } from "@prisma/client";
import { llmComplete } from "../llm/client";
import { extractJson } from "../llm/json";
import type { StructuredBrief } from "../types";
import { logAgent } from "../activity";

const SYSTEM = `You are the Idea Intake & Structuring Agent for Campus ProtoForge, a university innovation platform.
Convert raw challenge ideas into a standardized brief. Reply with ONLY a JSON object (no prose) with keys:
problemStatement (string), contextMotivation (string), constraintsAssumptions (string[]),
expectedLearners: {year (string), skills (string[])}, successMetrics (string[]), evaluationHints (string[]).`;

function heuristicBrief(challenge: Challenge): StructuredBrief {
  const raw = challenge.rawDescription.trim();
  const sentences = raw.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const problem = sentences[0] ?? raw;
  const tags = JSON.parse(challenge.domainTags || "[]") as string[];
  return {
    problemStatement: problem.endsWith(".") ? problem : `${problem}.`,
    contextMotivation: `This challenge was submitted as a ${challenge.kind.replace("_", " ")} in ${challenge.department || "an interdisciplinary"} context. ${sentences.slice(1).join(". ")}${sentences.length > 1 ? "." : ""}`,
    constraintsAssumptions: [
      "Teams should scope a working MVP within one semester.",
      "Use publicly available APIs or datasets where possible.",
      "Assume access to standard laptop hardware and campus Wi-Fi.",
    ],
    expectedLearners: {
      year: "2nd–4th year undergraduates",
      skills: tags.length ? tags : ["Programming basics", "Problem framing"],
    },
    successMetrics: [
      "A demoable prototype passing 3+ core user flows.",
      "Measurable improvement on the stated problem (define one metric).",
    ],
    evaluationHints: [
      "Problem clarity and motivation",
      "Feasibility of the proposed approach",
      "Quality of the MVP demo",
    ],
  };
}

export async function runStructureAgent(challenge: Challenge, actorId?: string | null) {
  const tags = JSON.parse(challenge.domainTags || "[]") as string[];
  const { result, config } = await llmComplete(
    "structure",
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Title: ${challenge.title}\nKind: ${challenge.kind}\nDepartment: ${challenge.department ?? "unspecified"}\nCourse: ${challenge.courseTag ?? "n/a"}\nDifficulty: ${challenge.difficulty}\nTags: ${tags.join(", ") || "none"}\nExpected impact: ${challenge.expectedImpact ?? "n/a"}\nRaw idea:\n${challenge.rawDescription}`,
      },
    ],
  );

  let brief: StructuredBrief | null = null;
  if (result) brief = extractJson<StructuredBrief>(result.text);
  const usedLlm = Boolean(brief);
  if (!brief) brief = heuristicBrief(challenge);

  await prisma.challenge.update({
    where: { id: challenge.id },
    data: { structuredBrief: JSON.stringify(brief) },
  });

  await logAgent({
    agentName: "Idea Structurer",
    actionType: usedLlm ? "structured_brief" : "structured_brief_heuristic",
    relatedEntityType: "challenge",
    relatedEntityId: challenge.id,
    actorId,
    payload: { engine: result ? `${config.provider}/${config.model}` : "heuristic" },
  });

  return { brief, engine: result ? `${config.provider}/${config.model}` : "heuristic" };
}

import { prisma } from "../db";
