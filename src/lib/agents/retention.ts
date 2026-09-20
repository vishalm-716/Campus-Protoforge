import { prisma } from "../db";
import { logAgent } from "../activity";
import { parseJson } from "../utils";

export interface AtRiskTeam {
  teamId: string;
  teamName: string;
  challengeTitle: string;
  department: string | null;
  daysSinceActivity: number;
  incompleteEarlyMilestones: number;
  nextDueDate: string | null;
  riskLevel: "high" | "medium" | "low";
  reasons: string[];
  nudge: string;
}

const INACTIVITY_DAYS_THRESHOLD = 7;
const DUE_SOON_DAYS = 7;

export async function runRetentionAgent(): Promise<{ atRisk: AtRiskTeam[]; healthy: number; generatedAt: string }> {
  const teams = await prisma.team.findMany({
    include: {
      challenge: true,
      track: { include: { milestones: { orderBy: { orderIndex: "asc" } } } },
      members: true,
    },
  });

  const now = Date.now();
  const atRisk: AtRiskTeam[] = [];
  let healthy = 0;

  for (const team of teams) {
    const days = Math.floor((now - team.lastActivityAt.getTime()) / 86_400_000);
    const milestones = team.track?.milestones ?? [];
    const open = milestones.filter((m) => m.status !== "done");
    const earlyUnfinished = open.filter((m) => m.orderIndex <= 1).length;
    const nextDue = open.map((m) => m.dueDate).filter(Boolean).sort((a, b) => a!.getTime() - b!.getTime())[0] ?? null;

    const reasons: string[] = [];
    if (days >= INACTIVITY_DAYS_THRESHOLD) reasons.push(`No activity for ${days} days.`);
    if (earlyUnfinished > 0 && days >= 3) reasons.push(`Early milestone still unfinished after ${days} days of inactivity.`);
    if (nextDue) {
      const daysToDue = Math.floor((nextDue.getTime() - now) / 86_400_000);
      if (daysToDue < 0) reasons.push(`A milestone is overdue by ${-daysToDue} day(s).`);
      else if (daysToDue <= DUE_SOON_DAYS && open.length === milestones.length) reasons.push(`First milestone due in ${daysToDue} day(s) but nothing started.`);
    }
    if (team.members.length <= 1) reasons.push("Solo team — consider recruiting a second member.");

    if (reasons.length === 0) {
      healthy++;
      continue;
    }

    const riskLevel: AtRiskTeam["riskLevel"] =
      (days >= 14 || reasons.length >= 3) ? "high" : days >= INACTIVITY_DAYS_THRESHOLD || reasons.length >= 2 ? "medium" : "low";

    atRisk.push({
      teamId: team.id,
      teamName: team.name,
      challengeTitle: team.challenge.title,
      department: team.challenge.department,
      daysSinceActivity: days,
      incompleteEarlyMilestones: earlyUnfinished,
      nextDueDate: nextDue ? nextDue.toISOString() : null,
      riskLevel,
      reasons,
      nudge:
        riskLevel === "high"
          ? `Schedule a 15-minute check-in with ${team.name} this week and ask for a repo link in the workspace.`
          : riskLevel === "medium"
            ? `Send ${team.name} a nudge to tick off the current checklist and upload one artefact.`
            : `Monitor ${team.name}; remind them of the next due date.`,
    });
  }

  atRisk.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 } as const;
    return order[a.riskLevel] - order[b.riskLevel];
  });

  await logAgent({
    agentName: "Retention Radar",
    actionType: "retention_scan",
    relatedEntityType: "system",
    relatedEntityId: "platform",
    payload: { atRiskCount: atRisk.length, healthy },
  });

  return { atRisk, healthy, generatedAt: new Date().toISOString() };
}
