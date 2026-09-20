import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Card, Badge, Chip, LinkButton } from "@/components/ui";
import { AgentConfigForm } from "@/components/agent-config-form";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const AGENT_META: Record<string, { icon: string; role: string; badge: string; tone: "brand" | "green" | "amber" | "violet" | "gray" }> = {
  "Idea Structurer": { icon: "🧩", role: "Turns raw ideas into standardized briefs", badge: "Intake", tone: "brand" },
  "Track Generator": { icon: "🗺️", role: "Builds five-phase milestone roadmaps", badge: "Curriculum", tone: "violet" },
  "Prototype Coach": { icon: "🤖", role: "Milestone-level guidance & API integration ideas", badge: "Coaching", tone: "green" },
  "Feedback Agent": { icon: "📝", role: "Drafts rubric scores — never finalises", badge: "Assessment", tone: "amber" },
  "Docs & Pitch": { icon: "🎤", role: "README outlines, summaries, pitch scripts", badge: "Docs", tone: "brand" },
  "Retention Radar": { icon: "🚨", role: "Flags at-risk teams and suggests nudges", badge: "Observability", tone: "gray" },
};

export default async function AgentsAdminPage() {
  await requireRole("admin");

  let configs = await prisma.agentConfig.findMany({ orderBy: { agentName: "asc" } });
  if (!configs.length) {
    const names = Object.keys(AGENT_META);
    await prisma.agentConfig.createMany({ data: names.map((n) => ({ agentName: n })) });
    configs = await prisma.agentConfig.findMany({ orderBy: { agentName: "asc" } });
  }

  const [logs, runs24h, byAgent] = await Promise.all([
    prisma.agentLog.findMany({ orderBy: { createdAt: "desc" }, take: 24 }),
    prisma.agentLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } } }),
    prisma.agentLog.groupBy({ by: ["agentName"], _count: { agentName: true } }),
  ]);
  const runsByAgent = new Map(byAgent.map((g) => [g.agentName, g._count.agentName]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Agent command center</h1>
          <p className="mt-1 text-sm text-ink-500">Every agent in the studio, live status, and autonomy controls. Review-first policies are enforced in code and cannot be disabled.</p>
        </div>
        <Chip tone="green" dot>{runs24h} runs in last 24h</Chip>
      </div>

      {/* Live activity strip */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-ink-100/60 px-5 py-3">
          <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-bold text-ink-800">Agent activity — live</h2>
          <span className="ml-auto text-[11px] text-ink-400">auto-refreshes on the dashboards</span>
        </div>
        {logs.length === 0 ? (
          <p className="px-5 py-4 text-sm text-ink-500">No agent activity yet — run any agent from a challenge or team workspace.</p>
        ) : (
          <div className="scroll-thin flex gap-2.5 overflow-x-auto px-5 py-3.5">
            {logs.map((l) => {
              const meta = AGENT_META[l.agentName];
              return (
                <div key={l.id} className="glass-deep min-w-[210px] shrink-0 rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden>{meta?.icon ?? "🤖"}</span>
                    <span className="text-[11px] font-bold text-ink-800">{l.agentName}</span>
                    <span className="ml-auto text-[10px] text-ink-400">{relativeTime(l.createdAt)}</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-ink-500" title={l.actionType}>{l.actionType}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Agent status cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {configs.map((c) => {
          const meta = AGENT_META[c.agentName] ?? { icon: "🤖", role: "", badge: "Agent", tone: "gray" as const };
          const enabled = c.enabled;
          const runs = runsByAgent.get(c.agentName) ?? 0;
          return (
            <Card key={c.id} hover glow={enabled ? "brand" : undefined} className="relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-300/15 blur-2xl" aria-hidden />
              <div className="relative flex items-start justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-transform duration-300 hover:scale-110 ${enabled ? "bg-gradient-to-br from-brand-50 to-violet-50 ring-1 ring-brand-200/60" : "bg-ink-100"}`} aria-hidden>
                  {meta.icon}
                </span>
                {enabled ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/70">
                    <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" /> ONLINE
                  </span>
                ) : (
                  <Badge tone="gray">OFFLINE</Badge>
                )}
              </div>
              <h3 className="mt-3.5 font-display text-base font-bold text-ink-900">{c.agentName}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{meta.role}</p>
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                <Chip tone={meta.tone}>{meta.badge}</Chip>
                <Chip tone="brand">autonomy {c.maxAutonomy}</Chip>
                <Chip tone="gray">{runs} runs</Chip>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Autonomy controls */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">Autonomy & prompts</h2>
          <LinkButton href="/dashboard" variant="ghost" className="text-xs">← Back to analytics</LinkButton>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {configs.map((c) => (
            <AgentConfigForm key={c.id} config={{ agentName: c.agentName, enabled: c.enabled, maxAutonomy: c.maxAutonomy, systemPrompt: c.systemPrompt }} />
          ))}
        </div>
      </div>

      {/* Run log */}
      <Card className="p-5">
        <h2 className="text-sm font-bold text-ink-800">Recent agent runs</h2>
        {logs.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">No agent activity yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100/70">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2 py-2 text-xs">
                <Badge tone="violet">{l.agentName}</Badge>
                <span className="font-medium text-ink-700">{l.actionType}</span>
                <span className="text-ink-400">{l.relatedEntityType} · {relativeTime(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
