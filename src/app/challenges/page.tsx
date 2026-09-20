import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { Card, Badge, LinkButton, EmptyState, StatusBadge } from "@/components/ui";
import { parseJson, truncate } from "@/lib/utils";
import { CHALLENGE_STATUSES, DIFFICULTIES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Explore Challenges",
  description: "Browse open campus challenges — course projects, lab briefs, capstones, and student ideas across every department.",
  alternates: { canonical: "/challenges" },
};

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  department?: string;
  difficulty?: string;
  status?: string;
  kind?: string;
}

export default async function ChallengesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const where: Record<string, unknown> = { visibility: "public" };
  if (sp.q) where.OR = [{ title: { contains: sp.q } }, { rawDescription: { contains: sp.q } }];
  if (sp.department) where.department = sp.department;
  if (sp.difficulty) where.difficulty = sp.difficulty;
  if (sp.status) where.status = sp.status;
  if (sp.kind) where.kind = sp.kind;

  const [challenges, departments] = await Promise.all([
    prisma.challenge.findMany({
      where,
      include: { owner: { select: { name: true, role: true } }, teams: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.challenge.findMany({ select: { department: true }, distinct: ["department"] }),
  ]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Challenge browser</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">Find a challenge worth building</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">Every challenge carries a structured brief and an AI-generated prototype track — pick one, form a team, start forging.</p>
        </div>

        <Card className="mb-8 p-4">
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" role="search">
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search challenges…"
              className="rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 lg:col-span-2"
              aria-label="Search challenges"
            />
            <select name="department" defaultValue={sp.department ?? ""} aria-label="Filter by department" className="rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm">
              <option value="">All departments</option>
              {departments.map((d) => d.department && <option key={d.department} value={d.department}>{d.department}</option>)}
            </select>
            <select name="difficulty" defaultValue={sp.difficulty ?? ""} aria-label="Filter by difficulty" className="rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm">
              <option value="">All difficulties</option>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select name="status" defaultValue={sp.status ?? ""} aria-label="Filter by status" className="rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm">
              <option value="">All stages</option>
              {CHALLENGE_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </form>
        </Card>

        {challenges.length === 0 ? (
          <EmptyState title="No challenges match those filters" sub="Try clearing a filter or two — or be the first to submit this kind of challenge." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((c) => {
              const brief = parseJson<{ problemStatement?: string }>(c.structuredBrief, {});
              const tags = parseJson<string[]>(c.domainTags, []);
              return (
                <Card
                  key={c.id}
                  hover
                  glow={c.status === "in_progress" ? "brand" : c.status === "open" ? "mint" : undefined}
                  className="flex h-full flex-col p-5"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <StatusBadge status={c.status} />
                    <Badge tone="gray">{c.kind.replace("_", " ")}</Badge>
                    {c.status === "in_progress" ? <span className="pulse-dot ml-auto h-2 w-2 rounded-full bg-brand-500" aria-label="active" /> : null}
                  </div>
                  <h2 className="font-display text-lg font-bold leading-snug text-ink-900">
                    <Link href={`/challenges/${c.id}`} className="hover:text-brand-700">{c.title}</Link>
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">
                    {truncate(brief.problemStatement ?? c.rawDescription, 150)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tags.slice(0, 3).map((t) => <Badge key={t} tone="brand">{t}</Badge>)}
                    <Badge tone="violet">{c.difficulty}</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-ink-100/70 pt-3 text-xs text-ink-400">
                    <span>by {c.owner.name} · {c.department ?? "Interdisciplinary"}</span>
                    <span>{c.teams.length} team{c.teams.length === 1 ? "" : "s"}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
