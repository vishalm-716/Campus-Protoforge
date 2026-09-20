import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { Card, Badge, LinkButton, Avatar, EmptyState } from "@/components/ui";
import Link from "next/link";
import { CreateTeamForm } from "@/components/create-team-form";
import { FeedbackInbox } from "@/components/feedback-inbox";
import { RegistryReviewQueue } from "@/components/registry-review-queue";

export const dynamic = "force-dynamic";

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ challenge?: string; create?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;

  const isFaculty = user.role === "faculty" || user.role === "admin";

  const teams = await prisma.team.findMany({
    where: isFaculty
      ? {
          OR: [
            { challenge: { ownerId: user.id } },
            { mentorId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        }
      : { members: { some: { userId: user.id } } },
    include: {
      challenge: { select: { id: true, title: true } },
      track: { select: { id: true, level: true, milestones: { select: { status: true } } } },
      members: { include: { user: { select: { name: true, avatar: true } } } },
      artefacts: { select: { id: true } },
      feedbacks: { select: { id: true, finalised: true } },
    },
    orderBy: { lastActivityAt: "desc" },
  });

  const myMemberships = new Set(
    (await prisma.teamMember.findMany({ where: { userId: user.id }, select: { teamId: true } })).map((t) => t.teamId),
  );

  const challengesWithTracks = await prisma.challenge.findMany({
    where: { tracks: { some: {} } },
    select: { id: true, title: true, tracks: { select: { id: true, level: true } } },
    orderBy: { createdAt: "desc" },
  });

  const selectedChallenge = sp.challenge;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">{isFaculty ? "Teams & review" : "My teams"}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {isFaculty ? "Monitor every team in your challenges, jump into workspaces, and manage feedback." : "Your active workspaces — milestones, artefacts, coach, and API Lab."}
          </p>
        </div>
        <LinkButton href={sp.create === "1" ? "/dashboard/teams" : "/dashboard/teams?create=1"} variant="primary">
          {sp.create === "1" ? "Close" : "＋ Create team"}
        </LinkButton>
      </div>

      {sp.create === "1" ? (
        <CreateTeamForm challenges={challengesWithTracks} preselected={selectedChallenge} />
      ) : null}

      {isFaculty ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <FeedbackInbox facultyId={user.id} />
          <RegistryReviewQueue />
        </div>
      ) : null}

      {teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          sub={isFaculty ? "Teams formed in your challenges will appear here." : "Join or create a team from a challenge that has a prototype track."}
          action={<LinkButton href="/dashboard/challenges" variant="outline">Browse challenges</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => {
            const ms = t.track?.milestones ?? [];
            const done = ms.filter((m) => m.status === "done").length;
            const pendingFeedback = t.feedbacks.filter((f) => !f.finalised).length;
            return (
              <Card key={t.id} hover className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-ink-900">{t.name}</h2>
                  {myMemberships.has(t.id) ? <Badge tone="brand">yours</Badge> : pendingFeedback ? <Badge tone="amber">{pendingFeedback} draft{pendingFeedback > 1 ? "s" : ""}</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-ink-400">{t.challenge.title}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
                  <span>{done}/{ms.length} milestones</span>
                  <span>·</span>
                  <span>{t.artefacts.length} artefacts</span>
                  <span>·</span>
                  <span>{t.track?.level ?? "—"}</span>
                </div>
                <div className="mt-3 flex -space-x-1.5">
                  {t.members.map((m) => (
                    <span key={m.id} className="ring-2 ring-white"><Avatar name={m.user.name} src={m.user.avatar} size={24} /></span>
                  ))}
                </div>
                <div className="mt-auto pt-4">
                  <LinkButton href={`/dashboard/teams/${t.id}`} variant="primary" className="w-full">Open workspace</LinkButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
