import { prisma } from "../db";
import { llmComplete } from "../llm/client";
import { logAgent } from "../activity";
import { parseJson } from "../utils";
import type { CoachSuggestion } from "../types";

export async function runCoachAgent(params: { teamId: string; milestoneId?: string; question?: string; actorId?: string | null }) {
  const team = await prisma.team.findUniqueOrThrow({
    where: { id: params.teamId },
    include: {
      challenge: true,
      track: { include: { milestones: { orderBy: { orderIndex: "asc" } } } },
      members: { include: { user: true } },
      artefacts: { orderBy: { createdAt: "desc" }, take: 5 },
      externalApis: true,
    },
  });

  const milestone = params.milestoneId
    ? team.track?.milestones.find((m) => m.id === params.milestoneId) ?? team.track?.milestones.find((m) => m.status !== "done")
    : team.track?.milestones.find((m) => m.status !== "done") ?? team.track?.milestones[0];

  const checklist = milestone ? parseJson<{ label: string; done: boolean }[]>(milestone.checklistItems, []) : [];
  const memberSkills = team.members.flatMap((m) => parseJson<string[]>(m.user.skills, []));
  const apiList = team.externalApis.map((a) => `${a.name} (${a.baseUrl}, auth: ${a.authType})`).join("; ") || "none registered";

  const context = `Challenge: ${team.challenge.title}
Brief: ${(team.challenge.structuredBrief ?? team.challenge.rawDescription).slice(0, 800)}
Track level: ${team.track?.level ?? "unknown"}
Current milestone: ${milestone ? `${milestone.orderIndex + 1}. ${milestone.title} (${milestone.status})` : "none"}
Checklist state: ${checklist.map((c) => `[${c.done ? "x" : " "}] ${c.label}`).join(" | ") || "none"}
Recent artefacts: ${team.artefacts.map((a) => `${a.type}: ${a.shortDescription || a.url}`).join("; ") || "none"}
Registered external APIs: ${apiList}
Team skills: ${Array.from(new Set(memberSkills)).slice(0, 12).join(", ") || "unknown"}
${params.question ? `Student question: ${params.question}` : ""}`;

  const system = `You are the Prototype Coach Agent for Campus ProtoForge. Give practical, encouraging, specific guidance for the current milestone. Reference the team's registered APIs when suggesting integrations. Keep it under 220 words. ${params.question ? "Answer the student's question directly." : "Structure: 2-4 short paragraphs or bullets: focus now, next steps, one concept explainer."}`;

  const { result, config } = await llmComplete("coach", [
    { role: "system", content: system },
    { role: "user", content: context },
  ], { teamId: team.id });

  let guidance: string;
  let suggestions: CoachSuggestion[];
  if (result) {
    guidance = result.text.trim();
    suggestions = [{ title: `Coach guidance (milestone ${milestone ? milestone.orderIndex + 1 : "—"})`, detail: guidance }];
  } else {
    const isEarly = !milestone || milestone.orderIndex <= 1;
    const apiSuggestion = team.externalApis.length
      ? `Wire "${team.externalApis[0].name}" (${team.externalApis[0].baseUrl}) into one user flow, with timeout + error handling.`
      : "Register the external APIs you plan to use in the API Lab so the coach can suggest concrete integrations.";
    guidance = `**Focus now:** ${milestone ? milestone.title : "start the track"}. ${milestone ? milestone.description : ""}\n\n**Next steps:**\n- ${checklist.filter((c) => !c.done).slice(0, 2).map((c) => c.label).join("\n- ") || "Review the checklist and tick completed items"}\n\n**Integration idea:** ${apiSuggestion}\n\n**Concept explainer:** ${isEarly ? "A good problem statement names the user, the pain, and the measurable outcome — e.g. 'Hostel students can't find free study rooms; we'll cut search time from 15 min to 1 min.'" : "Before demos, add graceful failures: timeouts, loading states, and a friendly error message. Reviewers notice error handling more than extra features."}`;
    suggestions = [
      { title: "Focus now", detail: milestone?.title ?? "Kick off the Discover phase" },
      { title: "Next step", detail: checklist.find((c) => !c.done)?.label ?? "Run a demo for a peer" },
      { title: "Integration idea", detail: apiSuggestion },
    ];
  }

  if (milestone) {
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { aiSuggestions: JSON.stringify(suggestions) },
    });
  }

  await logAgent({
    agentName: "Prototype Coach",
    actionType: params.question ? "coach_answer" : "coach_guidance",
    relatedEntityType: "team",
    relatedEntityId: team.id,
    actorId: params.actorId,
    payload: { engine: result ? `${config.provider}/${config.model}` : "heuristic", milestoneId: milestone?.id },
  });

  return { guidance, suggestions, milestoneId: milestone?.id ?? null, engine: result ? `${config.provider}/${config.model}` : "heuristic" };
}
