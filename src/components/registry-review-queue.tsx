import { prisma } from "@/lib/db";
import { Card, Badge } from "./ui";
import { RegistryReviewActions } from "./registry-review-actions";
import { relativeTime } from "@/lib/utils";

export async function RegistryReviewQueue() {
  const pending = await prisma.externalApi.findMany({
    where: { registryStatus: "pending" },
    include: { team: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
    take: 6,
  });

  return (
    <Card className="p-5">
      <h2 className="text-sm font-bold text-ink-800">🛡️ API Registry approvals</h2>
      {pending.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">No APIs waiting for review.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {pending.map((api) => (
            <li key={api.id} className="rounded-xl border border-ink-100/80 bg-white/60 px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-800">{api.name}</p>
                  <p className="truncate text-xs text-ink-400">{api.baseUrl} · {api.team?.name ?? "campus"} · {relativeTime(api.createdAt)}</p>
                </div>
                <Badge tone="amber">pending</Badge>
              </div>
              {api.description ? <p className="mt-1.5 text-xs text-ink-500">{api.description}</p> : null}
              <div className="mt-2">
                <RegistryReviewActions apiId={api.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
