import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { Card, Badge, EmptyState } from "@/components/ui";
import { parseJson, formatDate } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Learning Assets Library",
  description: "Graduated prototypes, briefs, and builds from past campus challenges — reusable learning assets for future cohorts.",
  alternates: { canonical: "/library" },
};

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const assets = await prisma.learningAsset.findMany({
    include: { challenge: { select: { id: true, title: true, department: true } }, publishedByUser: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Learning Assets Library</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">Prototypes that teach the next cohort</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            When faculty graduate a team's prototype, its brief, documentation, and artefacts become a reusable learning asset.
          </p>
        </div>

        {assets.length === 0 ? (
          <EmptyState title="No learning assets yet" sub="Faculty publish completed prototypes here so future students can learn from them." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((a) => {
              const tags = parseJson<string[]>(a.tags, []);
              return (
                <Card key={a.id} hover className="flex h-full flex-col p-5">
                  <h2 className="font-display text-lg font-bold text-ink-900">{a.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{a.summary?.slice(0, 200)}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tags.filter(Boolean).slice(0, 4).map((t) => <Badge key={t} tone="brand">{t}</Badge>)}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-ink-100/70 pt-3 text-xs text-ink-400">
                    <span>Published by {a.publishedByUser.name}</span>
                    <span>{formatDate(a.createdAt)}</span>
                  </div>
                  {a.challenge ? (
                    <Link href={`/challenges/${a.challenge.id}`} className="mt-2 text-xs font-semibold text-brand-600 hover:underline">
                      View source challenge: {a.challenge.title} →
                    </Link>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
