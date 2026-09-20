import { prisma } from "@/lib/db";
import { json } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  const challengeId = searchParams.get("challengeId");
  const limit = Math.min(Number(searchParams.get("limit") ?? 25), 100);

  const where: Record<string, unknown> = {};
  if (teamId) where.teamId = teamId;
  if (challengeId) where.challengeId = challengeId;
  if (!teamId && !challengeId) {
    // public feed
  }

  const events = await prisma.activityEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return json({ events });
}
