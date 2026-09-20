import { prisma } from "../db";
import { llmComplete } from "../llm/client";
import { extractJson } from "../llm/json";
import { logAgent } from "../activity";
import { parseJson } from "../utils";
import type { AiDraft, RubricCriterion } from "../types";
import { RUBRIC_TEMPLATE } from "../constants";

export async function runFeedbackAgent(params: { teamId: string; milestoneId?: string; facultyId: string }) {
  const team = await prisma.team.findUniqueOrThrow({
    where: { id: params.teamId },
    include: {
      challenge: true,
      track: { include: { milestones: { orderBy: { orderIndex: "asc" } } } },
      artefacts: true,
      members: { include: { user: true } },
    },
  });

  const milestone = params.milestoneId
    ? team.track?.milestones.find((m) => m.id === params.milestoneId)
    : team.track?.milestones.find((m) => m.status !== "done");

  const checklist = milestone ? parseJson<{ label: string; done: boolean }[]>(milestone.checklistItems, []) : [];
  const doneCount = team.track?.milestones.filter((m) => m.status === "done").length ?? 0;
  const totalCount = team.track?.milestones.length ?? 0;

  const context = `Challenge: ${team.challenge.title}
Track: ${totalCount} milestones, ${doneCount} done.
Current milestone: ${milestone ? `${milestone.title} (${milestone.status})` : "none"}
Checklist: ${checklist.map((c) => `[${c.done ? "x" : " "}] ${c.label}`).join(" | ") || "none"}
Artefacts (${team.artefacts.length}): ${team.artefacts.map((a) => `${a.type}: ${a.shortDescription || a.url}`).join("; ") || "none yet"}
Team: ${team.members.map((m) => m.user.name).join(", ")}`;

  const system = `You are the Feedback & Rubric Agent. You DRAFT scores only — faculty always confirm (review-first policy; you never finalise grades).
Rubric: ${RUBRIC_TEMPLATE.map((r) => `${r.name} (max ${r.maxScore})`).join(", ")}.
Reply with ONLY JSON: { "rubricScores": [{"name": string, "score": number|null, "aiComment": string, "needsHumanReview": boolean}],
"commentSuggestions": string[], "flags": string[], "summary": string, "confidence": number }.
Where artefact evidence is missing or ambiguous, set needsHumanReview=true and explain in flags. Be fair and specific.`;

  const { result, config } = await llmComplete("feedback", [
    { role: "system", content: system },
    { role: "user", content: context },
  ]);

  let draft: AiDraft | null = result ? extractJson<AiDraft>(result.text) : null;
  if (!draft || !Array.isArray(draft.rubricScores)) {
    // Heuristic draft: evidence-based scoring with explicit uncertainty flags.
    const artefactCount = team.artefacts.length;
    const doneRatio = totalCount ? doneCount / totalCount : 0;
    const hasRepo = team.artefacts.some((a) => a.type === "code_repo");
    const hasVideo = team.artefacts.some((a) => a.type === "demo_video");
    const rubricScores: RubricCriterion[] = RUBRIC_TEMPLATE.map((r) => {
      let score: number | null;
      let needsHumanReview = false;
      switch (r.name) {
        case "Problem clarity":
          score = team.challenge.structuredBrief ? Math.round(r.maxScore * 0.7) : null;
          needsHumanReview = !team.challenge.structuredBrief;
          break;
        case "Technical depth":
          score = hasRepo ? Math.round(r.maxScore * (0.4 + 0.4 * doneRatio)) : null;
          needsHumanReview = !hasRepo;
          break;
        case "Prototype completeness":
          score = artefactCount ? Math.round(r.maxScore * (0.3 + 0.5 * doneRatio)) : null;
          needsHumanReview = artefactCount === 0;
          break;
        case "Use of APIs / integrations":
          score = artefactCount ? Math.round(r.maxScore * 0.5) : null;
          needsHumanReview = artefactCount === 0;
          break;
        case "Documentation & pitch":
          score = hasVideo ? Math.round(r.maxScore * 0.6) : null;
          needsHumanReview = !hasVideo;
          break;
        default:
          score = null;
          needsHumanReview = true;
      }
      return {
        name: r.name,
        maxScore: r.maxScore,
        score,
        aiComment: score === null ? "Insufficient evidence in artefacts; needs human review." : `Heuristic estimate from ${artefactCount} artefact(s) and ${doneCount}/${totalCount} milestones done.`,
        needsHumanReview,
      };
    });
    draft = {
      rubricScores,
      commentSuggestions: [
        artefactCount === 0
          ? "No artefacts uploaded yet — request a repo link and a short demo video before scoring."
          : `Good progress: ${doneCount}/${totalCount} milestones complete with ${artefactCount} artefact(s).`,
        "Suggest recording a 2-minute demo video for the next review round.",
      ],
      flags: scoreFlags(rubricScores),
      summary: `Draft based on ${artefactCount} artefact(s), ${doneCount}/${totalCount} milestones done.`,
      confidence: 0.35,
    };
  }

  // Normalize: ensure maxScore present
  draft.rubricScores = draft.rubricScores.map((s) => ({
    ...s,
    maxScore: s.maxScore ?? RUBRIC_TEMPLATE.find((t) => t.name === s.name)?.maxScore ?? 10,
  }));
  draft.flags = Array.isArray(draft.flags) ? draft.flags : scoreFlags(draft.rubricScores);
  if (typeof draft.confidence !== "number") draft.confidence = 0.4;

  const feedback = await prisma.feedback.create({
    data: {
      teamId: team.id,
      milestoneId: milestone?.id ?? null,
      facultyId: params.facultyId,
      aiDraft: JSON.stringify(draft),
      rubricScores: "[]",
      comments: "",
      finalised: false, // NEVER auto-finalised — review-first policy
    },
  });

  await logAgent({
    agentName: "Feedback Agent",
    actionType: "feedback_draft_created",
    relatedEntityType: "team",
    relatedEntityId: team.id,
    actorId: params.facultyId,
    payload: { feedbackId: feedback.id, engine: result ? `${config.provider}/${config.model}` : "heuristic" },
  });

  return { feedback, draft, engine: result ? `${config.provider}/${config.model}` : "heuristic" };
}

function scoreFlags(scores: RubricCriterion[]): string[] {
  const flags: string[] = [];
  for (const s of scores) {
    if (s.score === null || s.needsHumanReview) {
      flags.push(`${s.name}: needs human review — insufficient artefact evidence.`);
    }
  }
  if (!flags.length) flags.push("All criteria had reasonable evidence; still confirm before finalising.");
  return flags;
}
