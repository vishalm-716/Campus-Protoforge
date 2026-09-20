import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { Card, Badge, EmptyState } from "@/components/ui";
import { RegistryReviewActions } from "@/components/registry-review-actions";
import Link from "next/link";
import { parseJson } from "@/lib/utils";
import { API_CATEGORIES_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardRegistry() {
  const user = await requireUser();
  const isReviewer = user.role === "faculty" || user.role === "admin";

  const apis = await prisma.externalApi.findMany({
    where: isReviewer ? {} : { isPublishedToRegistry: true, registryStatus: "approved" },
    include: { team: { select: { name: true, challenge: { select: { title: true } } } }, testCases: { select: { id: true } } },
    orderBy: [{ registryStatus: "asc" }, { usageCount: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">🔌 Campus API Registry</h1>
        <p className="mt-1 text-sm text-ink-500">
          {isReviewer ? "Review submissions, monitor usage, and curate the campus API catalog." : "Approved campus APIs you can register in your team's API Lab."}
        </p>
      </div>

      {apis.length === 0 ? (
        <EmptyState title="Registry is empty" sub="Teams can submit their APIs for review from their workspace's API Lab." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apis.map((api) => {
            const tags = parseJson<string[]>(api.tags, []);
            return (
              <Card key={api.id} hover className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-bold text-ink-900">{api.name}</h2>
                    <code className="block truncate text-[11px] text-ink-400">{api.baseUrl}</code>
                  </div>
                  <Badge tone={api.registryStatus === "approved" ? "green" : api.registryStatus === "pending" ? "amber" : api.registryStatus === "rejected" ? "red" : "gray"}>
                    {api.registryStatus}
                  </Badge>
                </div>
                <p className="mt-2 flex-1 text-xs text-ink-500">{api.description || "No description."}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="brand">{API_CATEGORIES_LABELS[api.category] ?? api.category}</Badge>
                  {api.authType !== "none" ? <Badge tone="amber">{api.authType}</Badge> : null}
                  {tags.slice(0, 2).map((t) => <Badge key={t} tone="gray">#{t}</Badge>)}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ink-100/70 pt-3 text-xs text-ink-400">
                  <span className="truncate">{api.team?.name ?? "Campus"}</span>
                  <span>{api.usageCount} runs · {api.testCases.length} cases</span>
                </div>
                {isReviewer && api.registryStatus === "pending" ? (
                  <div className="mt-3"><RegistryReviewActions apiId={api.id} /></div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-5 text-sm">
        <p className="text-ink-600">
          Want your team's API listed publicly? Register it in your workspace's <Link href="/dashboard/teams" className="font-semibold text-brand-600 hover:underline">API Lab</Link> and tick “Submit to the campus API Registry”.
        </p>
      </Card>
    </div>
  );
}
