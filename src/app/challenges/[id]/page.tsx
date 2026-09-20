import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Card, Badge, StatusBadge, Avatar, ProgressBar } from "@/components/ui";
import { parseJson, formatDate } from "@/lib/utils";
import { ActivityStream } from "@/components/activity-stream";
import { AgentActions } from "@/components/agent-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const challenge = await prisma.challenge.findUnique({ where: { id }, select: { title: true, rawDescription: true } });
  if (!challenge) return { title: "Challenge not found" };
  return {
    title: challenge.title,
    description: challenge.rawDescription.slice(0, 160),
    alternates: { canonical: `/challenges/${id}` },
  };
}

export default async function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [challenge, user] = await Promise.all([
    prisma.challenge.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, role: true, title: true, avatar: true, department: true } },
        tracks: { include: { milestones: { orderBy: { orderIndex: "asc" } } } },
        teams: {
          include: {
            members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
            track: { select: { level: true } },
          },
        },
      },
    }),
    getSessionUser(),
  ]);

  if (!challenge) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Challenge not found</h1>
          <Link href="/challenges" className="mt-4 inline-block text-brand-600 hover:underline">← Back to challenges</Link>
        </main>
      </>
    );
  }

  const brief = parseJson<import("@/lib/types").StructuredBrief | null>(challenge.structuredBrief, null);
  const track = challenge.tracks[0];
  const tags = parseJson<string[]>(challenge.domainTags, []);

  const doneCount = track?.milestones.filter((m) => m.status === "done").length ?? 0;
  const progress = track?.milestones.length ? (doneCount / track.milestones.length) * 100 : 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link href="/challenges" className="text-sm text-ink-400 hover:text-brand-600">← All challenges</Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Header card */}
            <Card className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={challenge.status} />
                <Badge tone="gray">{challenge.kind.replace("_", " ")}</Badge>
                <Badge tone="violet">{challenge.difficulty}</Badge>
                {challenge.briefStatus === "approved" ? <Badge tone="green">Brief approved</Badge> : <Badge tone="amber">Brief awaiting approval</Badge>}
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold text-ink-900">{challenge.title}</h1>
              <div className="mt-4 flex items-center gap-3 text-sm text-ink-500">
                <Avatar name={challenge.owner.name} src={challenge.owner.avatar} size={36} />
                <span>
                  {challenge.owner.title ? `${challenge.owner.title} ` : ""}{challenge.owner.name} · {challenge.owner.role} · {challenge.department ?? "Interdisciplinary"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tags.map((t) => <Badge key={t} tone="brand">{t}</Badge>)}
                {challenge.courseTag ? <Badge tone="gray">Course: {challenge.courseTag}</Badge> : null}
              </div>
              {challenge.expectedImpact ? (
                <p className="mt-4 rounded-xl bg-brand-50/70 px-4 py-3 text-sm text-brand-800">
                  <strong className="font-semibold">Expected impact:</strong> {challenge.expectedImpact}
                </p>
              ) : null}
              {user && (user.id === challenge.ownerId || user.role === "faculty" || user.role === "admin") ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  <AgentActions challengeId={challenge.id} canReview={user.role === "faculty" || user.role === "admin"} />
                </div>
              ) : null}
            </Card>

            {/* Brief */}
            <Card className="p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-ink-900">Structured brief</h2>
              {brief ? (
                <div className="mt-4 space-y-5 text-sm">
                  <section aria-labelledby="ps">
                    <h3 id="ps" className="font-semibold text-ink-800">Problem statement</h3>
                    <p className="mt-1.5 leading-relaxed text-ink-600">{brief.problemStatement}</p>
                  </section>
                  <section aria-labelledby="cm">
                    <h3 id="cm" className="font-semibold text-ink-800">Context & motivation</h3>
                    <p className="mt-1.5 leading-relaxed text-ink-600">{brief.contextMotivation}</p>
                  </section>
                  <section aria-labelledby="ca">
                    <h3 id="ca" className="font-semibold text-ink-800">Constraints & assumptions</h3>
                    <ul className="mt-1.5 list-inside list-disc space-y-1 text-ink-600">
                      {(brief.constraintsAssumptions ?? []).map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </section>
                  <section aria-labelledby="el">
                    <h3 id="el" className="font-semibold text-ink-800">Expected learners</h3>
                    <p className="mt-1.5 text-ink-600">
                      {brief.expectedLearners?.year} — skills: {(brief.expectedLearners?.skills ?? []).join(", ")}
                    </p>
                  </section>
                  <section aria-labelledby="sm">
                    <h3 id="sm" className="font-semibold text-ink-800">Success metrics</h3>
                    <ul className="mt-1.5 list-inside list-disc space-y-1 text-ink-600">
                      {(brief.successMetrics ?? []).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </section>
                  <section aria-labelledby="eh">
                    <h3 id="eh" className="font-semibold text-ink-800">Evaluation hints</h3>
                    <ul className="mt-1.5 list-inside list-disc space-y-1 text-ink-600">
                      {(brief.evaluationHints ?? []).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </section>
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-ink-200 bg-white/50 p-5 text-sm text-ink-500">
                  No structured brief yet. Run the <strong>Idea Structurer agent</strong> to convert the raw description into a standardized brief.
                </p>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-medium text-ink-400 hover:text-ink-600">Original raw description</summary>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-500">{challenge.rawDescription}</p>
              </details>
            </Card>

            {/* Track */}
            {track ? (
              <Card className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-ink-900">Prototype track</h2>
                  <Badge tone="brand">Level: {track.level}</Badge>
                </div>
                <div className="mt-3">
                  <ProgressBar value={progress} />
                  <p className="mt-1.5 text-xs text-ink-400">{doneCount}/{track.milestones.length} milestones complete</p>
                </div>
                <ol className="mt-6 space-y-4">
                  {track.milestones.map((m, idx) => {
                    const checklist = parseJson<{ label: string; done: boolean }[]>(m.checklistItems, []);
                    const suggestions = parseJson<string[]>(m.aiSuggestions, []);
                    const resources = suggestions.filter((s) => s.startsWith("http"));
                    return (
                      <li key={m.id} className="relative rounded-2xl border border-ink-100/80 bg-white/60 p-5">
                        <div className="flex items-start gap-4">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${m.status === "done" ? "bg-emerald-100 text-emerald-700" : m.status === "in_progress" ? "bg-amber-100 text-amber-700" : "bg-ink-100 text-ink-500"}`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-ink-900">{m.title}</h3>
                              <StatusBadge status={m.status} />
                              {m.dueDate ? <span className="text-xs text-ink-400">due {formatDate(m.dueDate)}</span> : null}
                            </div>
                            <p className="mt-1.5 text-sm text-ink-500">{m.description}</p>
                            {checklist.length ? (
                              <ul className="mt-3 grid gap-1 text-xs text-ink-500 sm:grid-cols-2">
                                {checklist.map((c, i) => (
                                  <li key={i} className="flex items-center gap-1.5">
                                    <span aria-hidden className={c.done ? "text-emerald-500" : "text-ink-300"}>{c.done ? "☑" : "☐"}</span>
                                    {c.label}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            {resources.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {resources.slice(0, 4).map((r) => {
                                  const [label, url] = r.split(/:\s?(?=https?:\/\/)/);
                                  return (
                                    <a key={r} href={url ?? r} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 hover:bg-ink-100">
                                      📎 {label}
                                    </a>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            ) : (
              <Card className="p-8 text-center text-sm text-ink-500">
                No prototype track generated yet. {user ? <AgentActions challengeId={challenge.id} canReview={false} /> : "Sign in to generate one."}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="text-sm font-bold text-ink-800">Teams building this</h3>
              {challenge.teams.length === 0 ? (
                <p className="mt-3 text-xs text-ink-400">No teams yet. Sign in as a student and create the first team from your dashboard.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {challenge.teams.map((t) => (
                    <li key={t.id} className="rounded-xl border border-ink-100/80 bg-white/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/dashboard/teams/${t.id}`} className="text-sm font-semibold text-ink-800 hover:text-brand-700">{t.name}</Link>
                        <Badge tone="gray">{t.track?.level ?? "—"}</Badge>
                      </div>
                      <div className="mt-2 flex -space-x-1.5">
                        {t.members.map((m) => (
                          <span key={m.id} className="ring-2 ring-white">
                            <Avatar name={m.user.name} src={m.user.avatar} size={22} />
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <ActivityStream challengeId={challenge.id} />
          </div>
        </div>
      </main>
    </>
  );
}
