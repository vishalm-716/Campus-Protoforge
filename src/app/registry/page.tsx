import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { Card, Badge, EmptyState } from "@/components/ui";
import { parseJson } from "@/lib/utils";
import { API_CATEGORIES_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Campus API Registry",
  description: "Discover student-built and campus-approved APIs — edtech, analytics, sports, and utility APIs shared across departments for reuse in prototypes.",
  alternates: { canonical: "/registry" },
};

export const dynamic = "force-dynamic";

export default async function RegistryPage({ searchParams }: { searchParams: Promise<{ category?: string; tag?: string }> }) {
  const sp = await searchParams;
  const where: Record<string, unknown> = { isPublishedToRegistry: true, registryStatus: "approved" };
  if (sp.category) where.category = sp.category;

  let apis = await prisma.externalApi.findMany({
    where,
    include: { team: { select: { name: true, challenge: { select: { title: true } } } } },
    orderBy: { usageCount: "desc" },
  });

  if (sp.tag) {
    apis = apis.filter((a) => parseJson<string[]>(a.tags, []).includes(sp.tag!));
  }

  const allTags = Array.from(new Set(apis.flatMap((a) => parseJson<string[]>(a.tags, []))));
  const categories = Array.from(new Set(apis.map((a) => a.category)));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Campus API Registry</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">APIs built by campus, for campus</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            Every listed API was built by a student team and approved by faculty. Register them in your team's API Lab to start integrating.
          </p>
        </div>

        <Card className="mb-8 flex flex-wrap gap-2 p-4">
          <a href="/registry" className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${!sp.category && !sp.tag ? "bg-brand-600 text-white" : "border border-ink-200 text-ink-600 hover:border-brand-300"}`}>All</a>
          {categories.map((c) => (
            <a key={c} href={`/registry?category=${c}`} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${sp.category === c ? "bg-brand-600 text-white" : "border border-ink-200 text-ink-600 hover:border-brand-300"}`}>
              {API_CATEGORIES_LABELS[c] ?? c}
            </a>
          ))}
          {allTags.slice(0, 8).map((t) => (
            <a key={t} href={`/registry?tag=${encodeURIComponent(t)}`} className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${sp.tag === t ? "bg-accent-500 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"}`}>
              #{t}
            </a>
          ))}
        </Card>

        {apis.length === 0 ? (
          <EmptyState title="No published APIs yet" sub="When teams publish their APIs and faculty approve them, they appear here for the whole campus." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {apis.map((api) => {
              const tags = parseJson<string[]>(api.tags, []);
              const endpoints = parseJson<{ method: string; path: string; description?: string }[]>(api.exampleEndpoints, []);
              return (
                <Card key={api.id} hover className="relative flex h-full flex-col overflow-hidden p-5">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-brand-300/15 blur-2xl" aria-hidden />
                  <div className="relative flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg font-bold text-ink-900">{api.name}</h2>
                    <Badge tone="green">approved</Badge>
                  </div>
                  <p className="relative mt-2 flex-1 text-sm text-ink-500">{api.description || "No description provided."}</p>
                  <code className="relative mt-3 block truncate rounded-lg bg-gradient-to-r from-ink-50 to-brand-50/50 px-2.5 py-1.5 text-[11px] text-ink-600 ring-1 ring-ink-100">{api.baseUrl}</code>
                  <div className="relative mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="brand">{API_CATEGORIES_LABELS[api.category] ?? api.category}</Badge>
                    {api.authType !== "none" ? <Badge tone="amber">auth: {api.authType.replace("_", " ")}</Badge> : <Badge tone="gray">no auth</Badge>}
                    {tags.slice(0, 3).map((t) => <Badge key={t} tone="gray">#{t}</Badge>)}
                  </div>
                  {endpoints.length ? (
                    <div className="mt-3 space-y-1">
                      {endpoints.slice(0, 3).map((e, i) => (
                        <p key={i} className="truncate text-[11px] text-ink-400">
                          <span className="font-mono font-semibold text-emerald-600">{e.method}</span> {e.path}{e.description ? ` — ${e.description}` : ""}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  <div className="relative mt-4 flex items-center justify-between border-t border-ink-100/70 pt-3 text-xs text-ink-400">
                    <span>by {api.team?.name ?? "Campus"}</span>
                    <span>{api.usageCount} test run{api.usageCount === 1 ? "" : "s"}</span>
                  </div>
                  <div className="relative mt-3 flex gap-2 text-xs">
                    {api.docsUrl ? <a href={api.docsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">Docs ↗</a> : null}
                    {api.repoUrl ? <a href={api.repoUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">GitHub ↗</a> : null}
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
