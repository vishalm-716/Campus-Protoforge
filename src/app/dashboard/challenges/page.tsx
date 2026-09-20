import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { Card, Badge, StatusBadge, LinkButton } from "@/components/ui";
import { parseJson, truncate } from "@/lib/utils";
import { CreateChallengeForm } from "@/components/create-challenge-form";
import { DEPARTMENTS } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardChallenges({ searchParams }: { searchParams: Promise<{ mine?: string; new?: string; department?: string; difficulty?: string; q?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const showForm = sp.new === "1";

  const where: Record<string, unknown> = {};
  if (sp.mine === "1") where.ownerId = user.id;
  if (sp.department) where.department = sp.department;
  if (sp.difficulty) where.difficulty = sp.difficulty;
  if (sp.q) where.OR = [{ title: { contains: sp.q } }, { rawDescription: { contains: sp.q } }];
  if (user.role === "student" && sp.mine !== "1") where.visibility = "public";

  const challenges = await prisma.challenge.findMany({
    where,
    include: { owner: { select: { name: true } }, teams: { select: { id: true } }, tracks: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  const myTeamChallengeIds = new Set(
    (
      await prisma.team.findMany({ where: { members: { some: { userId: user.id } } }, select: { challengeId: true } })
    ).map((t) => t.challengeId),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Challenges</h1>
          <p className="mt-1 text-sm text-ink-500">{sp.mine === "1" ? "Challenges you submitted." : "Everything open across the campus."}</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href={sp.mine === "1" ? "/dashboard/challenges" : "/dashboard/challenges?mine=1"} variant="outline">
            {sp.mine === "1" ? "All challenges" : "My submissions"}
          </LinkButton>
          <LinkButton href={showForm ? "/dashboard/challenges" : "/dashboard/challenges?new=1"} variant="primary">
            {showForm ? "Close form" : "＋ Submit challenge"}
          </LinkButton>
        </div>
      </div>

      {showForm ? (
        <CreateChallengeForm role={user.role} defaultDepartment={user.department ?? undefined} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {challenges.map((c) => {
          const brief = parseJson<{ problemStatement?: string }>(c.structuredBrief, {});
          const tags = parseJson<string[]>(c.domainTags, []);
          const inTeam = myTeamChallengeIds.has(c.id);
          return (
            <Card key={c.id} hover className="flex h-full flex-col p-5">
              <div className="mb-2 flex items-center gap-2">
                <StatusBadge status={c.status} />
                {c.briefStatus === "ai_draft" && c.structuredBrief ? <Badge tone="violet">AI brief draft</Badge> : null}
                {inTeam ? <Badge tone="green">your team</Badge> : null}
              </div>
              <h2 className="font-display text-base font-bold leading-snug">
                <Link href={`/challenges/${c.id}`} className="text-ink-900 hover:text-brand-700">{c.title}</Link>
              </h2>
              <p className="mt-1.5 flex-1 text-sm text-ink-500">{truncate(brief.problemStatement ?? c.rawDescription, 120)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.slice(0, 3).map((t) => <Badge key={t} tone="brand">{t}</Badge>)}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-ink-100/70 pt-3 text-xs text-ink-400">
                <span>{c.owner.name}{c.tracks.length ? ` · ${c.tracks.length} track${c.tracks.length > 1 ? "s" : ""}` : ""}</span>
                <span>{c.teams.length} team{c.teams.length === 1 ? "" : "s"}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <LinkButton href={`/challenges/${c.id}`} variant="outline" className="flex-1">Open</LinkButton>
                {!inTeam && c.tracks.length > 0 ? (
                  <LinkButton href={`/dashboard/teams?challenge=${c.id}`} variant="ghost" className="flex-1">Form team</LinkButton>
                ) : null}
              </div>
            </Card>
          );
        })}
        {challenges.length === 0 ? (
          <Card className="col-span-full p-10 text-center text-sm text-ink-500">
            No challenges here yet. Submit the first one!
          </Card>
        ) : null}
      </div>
    </div>
  );
}
