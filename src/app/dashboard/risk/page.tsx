import { requireRole } from "@/lib/permissions";
import { runRetentionAgent } from "@/lib/agents/retention";
import { Card, Badge, LinkButton } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RiskRadarPage() {
  await requireRole("faculty", "admin");
  const { atRisk, healthy } = await runRetentionAgent();

  const counts = {
    high: atRisk.filter((t) => t.riskLevel === "high").length,
    medium: atRisk.filter((t) => t.riskLevel === "medium").length,
    low: atRisk.filter((t) => t.riskLevel === "low").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">🚨 Risk Radar</h1>
        <p className="mt-1 text-sm text-ink-500">The Retention Agent scans activity, milestone progress, and deadlines to flag teams that need a nudge.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-5"><p className="font-display text-3xl font-bold text-red-600">{counts.high}</p><p className="mt-1 text-xs text-ink-500">high risk</p></Card>
        <Card className="p-5"><p className="font-display text-3xl font-bold text-amber-500">{counts.medium}</p><p className="mt-1 text-xs text-ink-500">medium risk</p></Card>
        <Card className="p-5"><p className="font-display text-3xl font-bold text-ink-700">{counts.low}</p><p className="mt-1 text-xs text-ink-500">low risk</p></Card>
        <Card className="p-5"><p className="font-display text-3xl font-bold text-emerald-600">{healthy}</p><p className="mt-1 text-xs text-ink-500">healthy teams</p></Card>
      </div>

      {atRisk.length === 0 ? (
        <Card className="p-10 text-center text-sm text-ink-500">Every team is active and on track. 🎉</Card>
      ) : (
        <div className="space-y-3">
          {atRisk.map((t) => (
            <Card key={t.teamId} className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={t.riskLevel === "high" ? "red" : t.riskLevel === "medium" ? "amber" : "gray"}>{t.riskLevel} risk</Badge>
                <span className="font-display text-base font-bold text-ink-900">{t.teamName}</span>
                <span className="text-sm text-ink-500">{t.challengeTitle}</span>
                {t.department ? <Badge tone="gray">{t.department}</Badge> : null}
                <LinkButton href={`/dashboard/teams/${t.teamId}`} variant="outline" className="ml-auto px-3 py-1.5 text-xs">Open workspace</LinkButton>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-ink-600">
                {t.reasons.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
              <div className="mt-3 rounded-xl bg-brand-50/70 px-4 py-2.5 text-sm text-brand-900">
                <strong>Suggested nudge:</strong> {t.nudge}
              </div>
              {t.nextDueDate ? <p className="mt-2 text-xs text-ink-400">Next due date: {formatDate(t.nextDueDate)}</p> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
