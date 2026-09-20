import { prisma } from "@/lib/db";
import { json, jsonError, readJson, requireApiRole, isNextResponse } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiRole("faculty", "admin");
  if (isNextResponse(user)) return user;

  const { id } = await params;
  const body = await readJson<{ decision: "approved" | "rejected"; note?: string }>(req);
  if (!body?.decision || !["approved", "rejected"].includes(body.decision)) return jsonError("decision must be approved or rejected");

  const api = await prisma.externalApi.findUnique({ where: { id } });
  if (!api) return jsonError("Not found", 404);

  const updated = await prisma.externalApi.update({
    where: { id },
    data: {
      registryStatus: body.decision,
      isPublishedToRegistry: body.decision === "approved",
      reviewedBy: user.id,
      reviewNote: body.note ?? "",
    },
  });

  await logActivity({
    action: "registry.review",
    summary: `${body.decision === "approved" ? "Approved" : "Rejected"} "${api.name}" for the campus API Registry`,
    actorName: user.name,
    teamId: api.teamId,
  });

  return json({ api: updated });
}
