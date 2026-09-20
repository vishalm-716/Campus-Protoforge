import { prisma } from "@/lib/db";
import { Card, Badge } from "./ui";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";

export async function FeedbackInbox({ facultyId }: { facultyId: string }) {
  const drafts = await prisma.feedback.findMany({
    where: { OR: [{ facultyId }, { finalised: false }] },
    include: { team: { select: { id: true, name: true, challenge: { select: { title: true } } } }, milestone: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <Card className="p-5">
      <h2 className="text-sm font-bold text-ink-800">📝 Feedback drafts</h2>
      {drafts.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">No feedback drafts yet. Open a team workspace and request an AI rubric draft.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {drafts.map((f) => (
            <li key={f.id}>
              <Link href={`/dashboard/teams/${f.teamId}?tab=feedback`} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100/80 bg-white/60 px-3.5 py-2.5 hover:border-brand-200">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-800">{f.team.name} <span className="font-normal text-ink-400">· {f.milestone?.title ?? "general"}</span></p>
                  <p className="text-xs text-ink-400">{f.team.challenge.title} · {relativeTime(f.createdAt)}</p>
                </div>
                <Badge tone={f.finalised ? "green" : "amber"}>{f.finalised ? "finalised" : "draft"}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
