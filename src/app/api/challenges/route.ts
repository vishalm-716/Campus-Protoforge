import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiUser, isNextResponse } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const department = searchParams.get("department") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";
  const status = searchParams.get("status") ?? "";
  const kind = searchParams.get("kind") ?? "";
  const domain = searchParams.get("domain") ?? "";

  const where: Record<string, unknown> = { visibility: "public" };
  if (q) where.OR = [{ title: { contains: q } }, { rawDescription: { contains: q } }];
  if (department) where.department = department;
  if (difficulty) where.difficulty = difficulty;
  if (status) where.status = status;
  if (kind) where.kind = kind;
  if (domain) where.domainTags = { contains: domain };

  const challenges = await prisma.challenge.findMany({
    where,
    include: { owner: { select: { name: true, department: true, role: true } }, teams: { select: { id: true } }, tracks: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return json({ challenges });
}

interface CreateBody {
  title: string;
  rawDescription: string;
  domainTags?: string[];
  courseTag?: string;
  department?: string;
  difficulty?: string;
  expectedImpact?: string;
  visibility?: string;
  kind?: string;
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<CreateBody>(req);
  if (!body?.title?.trim() || !body.rawDescription?.trim()) return jsonError("Title and description are required");

  const kind = body.kind ?? (user.role === "student" ? "student_idea" : "official_course");
  const challenge = await prisma.challenge.create({
    data: {
      title: body.title.trim(),
      rawDescription: body.rawDescription.trim(),
      domainTags: JSON.stringify(body.domainTags ?? []),
      courseTag: body.courseTag ?? null,
      department: body.department ?? user.department ?? null,
      difficulty: body.difficulty ?? "intermediate",
      expectedImpact: body.expectedImpact ?? null,
      visibility: body.visibility ?? "public",
      kind,
      ownerId: user.id,
    },
  });

  await logActivity({
    action: "challenge.create",
    summary: `New challenge: ${challenge.title}`,
    actorName: user.name,
    challengeId: challenge.id,
  });

  return json({ challenge }, 201);
}
