import { prisma } from "@/lib/db";
import { Card, Badge } from "./ui";

export async function AgentConfigNotice() {
  let configs = await prisma.agentConfig.findMany({ orderBy: { agentName: "asc" } });
  if (!configs.length) {
    const names = ["Idea Structurer", "Track Generator", "Prototype Coach", "Feedback Agent", "Docs & Pitch", "Retention Radar"];
    await prisma.agentConfig.createMany({ data: names.map((n) => ({ agentName: n })) });
    configs = await prisma.agentConfig.findMany({ orderBy: { agentName: "asc" } });
  }
  const autonomyLabel: Record<string, string> = {
    suggest: "Suggest only",
    act_with_review: "Act with review",
    act: "Autonomous",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink-800">Agent fleet status</h2>
        <a href="/dashboard/agents" className="text-xs font-semibold text-brand-600 hover:underline">Configure →</a>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {configs.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-ink-100/80 bg-white/60 px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold text-ink-700">{c.agentName}</p>
              <p className="text-[11px] text-ink-400">{autonomyLabel[c.maxAutonomy] ?? c.maxAutonomy}</p>
            </div>
            <Badge tone={c.enabled ? "green" : "gray"}>{c.enabled ? "on" : "off"}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
