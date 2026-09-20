import { prisma } from "@/lib/db";
import { json, requireApiUser, isNextResponse } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const { searchParams } = new URL(req.url);
  const take = Math.min(Number(searchParams.get("take") ?? 30), 100);

  const logs = await prisma.agentLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { actor: { select: { name: true } } },
  });
  return json({ logs });
}
