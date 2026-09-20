import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";
import type { Role, SessionUser } from "./types";
import { prisma } from "./db";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function apiUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

export async function requireApiUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  return user;
}

export async function requireApiRole(...roles: Role[]): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!roles.includes(user.role)) return jsonError("Forbidden", 403);
  return user;
}

export function isNextResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

export async function canAccessTeamApi(teamId: string, user: SessionUser): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { members: { select: { userId: true } }, mentorId: true, challenge: { select: { ownerId: true } } },
  });
  if (!team) return false;
  if (user.role === "admin") return true;
  return team.members.some((m) => m.userId === user.id) || team.mentorId === user.id || team.challenge.ownerId === user.id;
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
