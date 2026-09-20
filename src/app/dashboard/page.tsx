import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { Card, Badge, LinkButton, StatusBadge, ProgressBar } from "@/components/ui";
import { ActivityStream } from "@/components/activity-stream";
import { parseJson } from "@/lib/utils";
import { AgentConfigNotice } from "@/components/agent-config-notice";
import { retentionForFaculty } from "@/components/risk-cards-server";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = await requireUser();

  const [myTeams, openChallenges, myChallenges] = await Promise.all([
    prisma.team.findMany({
      where: { members: { some: { userId: user.id } } },
      include: {
        challenge: { select: { id: true, title: true, status: true } },
        track: { include: { milestones: { select: { status: true } } } },
      },
      orderBy: { lastActivityAt: "desc" },
    }),
    prisma.challenge.count({ where: { status: "open", visibility: "public" } }),
    prisma.challenge.count({ where: { ownerId: user.id } }),
  ]);

  if (user.role === "admin") {
    const [challenges, teams, logs, assets] = await Promise.all([
      prisma.challenge.count(),
      prisma.team.count(),
      prisma.agentLog.count(),
      prisma.learningAsset.count(),
    ]);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Platform analytics</h1>
          <p className="mt-1 text-sm text-ink-500">Welcome, {user.name}. Here's the state of the campus innovation ecosystem.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Challenges", value: challenges, href: "/dashboard/challenges", icon: "🧭" },
            { label: "Active teams", value: teams, href: "/dashboard/teams", icon: "👥" },
            { label: "Agent runs", value: logs, href: "/dashboard/agents", icon: "🤖" },
            { label: "Learning assets", value: assets, href: "/dashboard/library", icon: "🎓" },
          ].map((s) => (
            <Card key={s.label} hover className="p-5">
              <span className="text-xl" aria-hidden>{s.icon}</span>
              <p className="mt-2 font-display text-3xl font-bold text-ink-900">{s.value}</p>
              <Link href={s.href} className="text-xs font-medium text-brand-600 hover:underline">{s.label} →</Link>
            </Card>
          ))}
        </div>
        <AgentConfigNotice />
        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink-800">Quick links</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <LinkButton href="/dashboard/agents" variant="outline">⚙️ Agent configuration</LinkButton>
            <LinkButton href="/dashboard/risk" variant="outline">🚨 Risk radar</LinkButton>
            <LinkButton href="/dashboard/registry" variant="outline">🔌 API registry approvals</LinkButton>
            <LinkButton href="/api/analytics" variant="ghost">📊 Raw analytics JSON</LinkButton>
          </div>
        </Card>
        <ActivityStream limit={14} />
      </div>
    );
  }

  if (user.role === "faculty") {
    const risk = await retentionForFaculty();
    const [pendingBriefs, draftFeedback] = await Promise.all([
      prisma.challenge.count({ where: { ownerId: user.id, briefStatus: "ai_draft" } }),
      prisma.feedback.count({ where: { facultyId: user.id, finalised: false } }),
    ]);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Faculty studio</h1>
          <p className="mt-1 text-sm text-ink-500">Welcome, {user.name}. Monitor teams, review drafts, and keep projects on track.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "My challenges", value: myChallenges, href: "/dashboard/challenges", icon: "🧭" },
            { label: "Briefs awaiting approval", value: pendingBriefs, href: "/dashboard/challenges", icon: "🧩" },
            { label: "Feedback drafts open", value: draftFeedback, href: "/dashboard/teams", icon: "📝" },
          ].map((s) => (
            <Card key={s.label} hover className="p-5">
              <span className="text-xl" aria-hidden>{s.icon}</span>
              <p className="mt-2 font-display text-3xl font-bold text-ink-900">{s.value}</p>
              <Link href={s.href} className="text-xs font-medium text-brand-600 hover:underline">{s.label} →</Link>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-800">🚨 At-risk teams (Retention Radar)</h2>
            <Link href="/dashboard/risk" className="text-xs font-semibold text-brand-600 hover:underline">Full radar →</Link>
          </div>
          {risk.atRisk.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500">All teams are active. Nothing to worry about right now.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {risk.atRisk.slice(0, 4).map((t) => (
                <li key={t.teamId} className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-100/80 bg-white/60 px-3.5 py-2.5 text-sm">
                  <Badge tone={t.riskLevel === "high" ? "red" : t.riskLevel === "medium" ? "amber" : "gray"}>{t.riskLevel} risk</Badge>
                  <span className="font-semibold text-ink-800">{t.teamName}</span>
                  <span className="text-ink-400">{t.reasons[0]}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-bold text-ink-800">Quick actions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <LinkButton href="/dashboard/challenges?new=1" variant="primary">＋ New challenge</LinkButton>
              <LinkButton href="/dashboard/teams" variant="outline">👥 Review teams</LinkButton>
              <LinkButton href="/dashboard/registry" variant="outline">🔌 Registry approvals</LinkButton>
            </div>
          </Card>
          <ActivityStream limit={10} compact />
        </div>
      </div>
    );
  }

  // Student
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Your studio, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-ink-500">Pick up where you left off, or find a new challenge to forge.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Open challenges", value: openChallenges, href: "/dashboard/challenges", icon: "🧭" },
          { label: "My challenges", value: myChallenges, href: "/dashboard/challenges?mine=1", icon: "💡" },
          { label: "My teams", value: myTeams.length, href: "/dashboard/teams", icon: "👥" },
        ].map((s) => (
          <Card key={s.label} hover className="p-5">
            <span className="text-xl" aria-hidden>{s.icon}</span>
            <p className="mt-2 font-display text-3xl font-bold text-ink-900">{s.value}</p>
            <Link href={s.href} className="text-xs font-medium text-brand-600 hover:underline">{s.label} →</Link>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink-800">Continue building</h2>
          {myTeams.length === 0 ? (
            <div className="mt-3">
              <p className="text-sm text-ink-500">You're not in a team yet. Browse challenges and create or join one.</p>
              <LinkButton href="/dashboard/challenges" className="mt-3">Find a challenge</LinkButton>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {myTeams.slice(0, 4).map((t) => {
                const ms = t.track?.milestones ?? [];
                const done = ms.filter((m) => m.status === "done").length;
                const pct = ms.length ? (done / ms.length) * 100 : 0;
                return (
                  <li key={t.id}>
                    <Link href={`/dashboard/teams/${t.id}`} className="block rounded-xl border border-ink-100/80 bg-white/60 p-3.5 transition hover:border-brand-200">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink-800">{t.name}</span>
                        <StatusBadge status={t.challenge.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-ink-400">{t.challenge.title}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <ProgressBar value={pct} className="flex-1" />
                        <span className="text-[11px] text-ink-400">{done}/{ms.length}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-bold text-ink-800">Quick actions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <LinkButton href="/dashboard/challenges?new=1" variant="primary">💡 Submit an idea</LinkButton>
              <LinkButton href="/dashboard/challenges" variant="outline">🧭 Browse challenges</LinkButton>
              <LinkButton href="/dashboard/teams" variant="outline">👥 My teams</LinkButton>
            </div>
          </Card>
          <ActivityStream limit={8} compact />
        </div>
      </div>
    </div>
  );
}
