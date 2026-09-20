import { prisma } from "./db";

interface LogActivityInput {
  action: string;
  summary: string;
  actorName: string;
  teamId?: string | null;
  challengeId?: string | null;
  meta?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput) {
  try {
    await prisma.activityEvent.create({
      data: {
        action: input.action,
        summary: input.summary,
        actorName: input.actorName,
        teamId: input.teamId ?? null,
        challengeId: input.challengeId ?? null,
        meta: JSON.stringify(input.meta ?? {}),
      },
    });
    if (input.teamId) {
      await prisma.team.update({ where: { id: input.teamId }, data: { lastActivityAt: new Date() } }).catch(() => {});
    }
  } catch {
    // activity logging is best-effort
  }
}

export async function logAgent(params: {
  agentName: string;
  actionType: string;
  relatedEntityType: string;
  relatedEntityId: string;
  payload?: Record<string, unknown>;
  actorId?: string | null;
}) {
  try {
    await prisma.agentLog.create({
      data: {
        agentName: params.agentName,
        actionType: params.actionType,
        relatedEntityType: params.relatedEntityType,
        relatedEntityId: params.relatedEntityId,
        payload: JSON.stringify(params.payload ?? {}),
        actorId: params.actorId ?? null,
      },
    });
    await logActivity({
      action: "agent.action",
      summary: `${params.agentName}: ${params.actionType}`,
      actorName: params.agentName,
      teamId: params.relatedEntityType === "team" ? params.relatedEntityId : undefined,
      challengeId: params.relatedEntityType === "challenge" ? params.relatedEntityId : undefined,
      meta: params.payload,
    });
  } catch {
    // best-effort
  }
}
