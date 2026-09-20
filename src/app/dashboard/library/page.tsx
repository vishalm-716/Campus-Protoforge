import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { Card, Badge, EmptyState } from "@/components/ui";
import { PublishAssetActions } from "@/components/publish-asset-actions";
import { formatDate, parseJson } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardLibrary() {
  const user = await requireUser();
  const isFaculty = user.role === "faculty" || user.role === "admin";

  const [assets, completedTeams] = await Promise.all([
    prisma.learningAsset.findMany({
      include: { challenge: { select: { id: true, title: true } }, publishedByUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    isFaculty
      ? prisma.team.findMany({
          where: {
            OR: [{ challenge: { ownerId: user.id } }, { mentorId: user.id }],
            feedbacks: { some: { finalised: true } },
          },
          include: { challenge: { select: { title: true } } },
          take: 8,
          orderBy: { lastActivityAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const publishedTeamIds = new Set(assets.map((a) => a.teamId).filter(Boolean));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">🎓 Learning Assets Library</h1>
        <p className="mt-1 text-sm text-ink-500">Graduated prototypes that future cohorts can learn from and build upon.</p>
      </div>

      {isFaculty && completedTeams.length ? (
        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink-800">Graduate a prototype</h2>
          <p className="mt-1 text-xs text-ink-400">Teams with finalised feedback can be promoted into the library.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {completedTeams
              .filter((t) => !publishedTeamIds.has(t.id))
              .map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-ink-100/80 bg-white/60 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-800">{t.name}</p>
                    <p className="truncate text-xs text-ink-400">{t.challenge.title}</p>
                  </div>
                  <PublishAssetActions teamId={t.id} />
                </li>
              ))}
          </ul>
        </Card>
      ) : null}

      {assets.length === 0 ? (
        <EmptyState title="No learning assets yet" sub="When faculty graduate completed prototypes, they appear here for everyone." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((a) => {
            const tags = parseJson<string[]>(a.tags, []);
            return (
              <Card key={a.id} hover className="flex h-full flex-col p-5">
                <h2 className="font-display text-base font-bold text-ink-900">{a.title}</h2>
                <p className="mt-2 flex-1 text-sm text-ink-500">{a.summary?.slice(0, 180)}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.filter(Boolean).slice(0, 4).map((t) => <Badge key={t} tone="brand">{t}</Badge>)}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-ink-100/70 pt-3 text-xs text-ink-400">
                  <span>by {a.publishedByUser.name} · {formatDate(a.createdAt)}</span>
                  {a.challenge ? <Link href={`/challenges/${a.challenge.id}`} className="font-semibold text-brand-600 hover:underline">challenge →</Link> : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
