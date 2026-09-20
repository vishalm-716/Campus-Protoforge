import { prisma } from "@/lib/db";
import { json, requireApiRole, isNextResponse } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireApiRole("faculty", "admin");
  if (isNextResponse(user)) return user;

  const [challenges, teams, milestones, artefacts, feedbacks, assets, apis, logs, events] = await Promise.all([
    prisma.challenge.findMany({ select: { status: true, createdAt: true, department: true } }),
    prisma.team.findMany({ select: { id: true, createdAt: true, lastActivityAt: true } }),
    prisma.milestone.findMany({ select: { status: true } }),
    prisma.artefact.findMany({ select: { type: true, createdAt: true } }),
    prisma.feedback.findMany({ select: { finalised: true } }),
    prisma.learningAsset.findMany({ select: { createdAt: true } }),
    prisma.externalApi.findMany({ select: { registryStatus: true, usageCount: true } }),
    prisma.agentLog.findMany({ select: { agentName: true, createdAt: true } }),
    prisma.activityEvent.findMany({ select: { createdAt: true } }),
  ]);

  const challengesByStatus: Record<string, number> = {};
  for (const c of challenges) challengesByStatus[c.status] = (challengesByStatus[c.status] ?? 0) + 1;

  const milestoneStats = milestones.reduce(
    (acc, m) => {
      acc[m.status] = (acc[m.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const activeTeams = teams.filter((t) => Date.now() - t.lastActivityAt.getTime() < 14 * 86_400_000).length;

  const completionRate = milestones.length ? Math.round(((milestoneStats.done ?? 0) / milestones.length) * 100) : 0;

  const agentActions: Record<string, number> = {};
  for (const l of logs) agentActions[l.agentName] = (agentActions[l.agentName] ?? 0) + 1;

  const registryStats = apis.reduce(
    (acc, a) => {
      acc[a.registryStatus] = (acc[a.registryStatus] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return json({
    totals: {
      challenges: challenges.length,
      teams: teams.length,
      activeTeams,
      milestones,
      artefacts: artefacts.length,
      feedbacks: feedbacks.length,
      learningAssets: assets.length,
      externalApis: apis.length,
      agentRuns: logs.length,
      activityEvents: events.length,
    },
    challengesByStatus,
    milestoneStats,
    completionRate,
    agentActions,
    registryStats,
  });
}
