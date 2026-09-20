import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getSessionUser } from "./auth";
import type { Role, SessionUser } from "./types";

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export function isTeamMember(memberUserIds: string[], userId: string) {
  return memberUserIds.includes(userId);
}

export async function canAccessTeam(teamId: string, user: SessionUser): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      members: { select: { userId: true } },
      mentorId: true,
      challenge: { select: { ownerId: true } },
    },
  });
  if (!team) return false;
  if (user.role === "admin") return true;
  if (team.members.some((m) => m.userId === user.id)) return true;
  if (team.mentorId === user.id) return true;
  if (team.challenge.ownerId === user.id) return true;
  return false;
}
