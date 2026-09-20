import { Card, Badge } from "./ui";
import { parseJson, relativeTime } from "@/lib/utils";

interface ApiLite {
  id: string;
  name: string;
  authType: string;
  exampleEndpoints: string;
  testCases: { id: string; name: string; lastStatus: number | null; lastRunAt: string | null; consecutiveFailures: number }[];
}

export function IntegrationHealth({ apis }: { apis: ApiLite[] }) {
  const allCases = apis.flatMap((a) => a.testCases.map((t) => ({ ...t, apiName: a.name })));
  const failing = allCases.filter((t) => t.consecutiveFailures >= 2);
  const healthy = allCases.filter((t) => t.lastStatus !== null && t.consecutiveFailures === 0);
  const untested = apis.filter((a) => a.testCases.length === 0);

  const tone = failing.length ? "red" : healthy.length ? "green" : "gray";
  const label = failing.length ? `${failing.length} failing` : healthy.length ? "all healthy" : untested.length ? "untested" : "no APIs";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-800">🩺 Integration Health</h3>
        <Badge tone={tone}>{label}</Badge>
      </div>
      {failing.length ? (
        <div className="mt-3 space-y-2">
          {failing.slice(0, 3).map((t) => (
            <div key={t.id} className="rounded-xl bg-red-50/80 px-3.5 py-2.5 text-xs text-red-800">
              <p className="font-semibold">{t.apiName} — {t.name}</p>
              <p className="mt-0.5">{t.consecutiveFailures} consecutive failures{t.lastStatus ? ` (last HTTP ${t.lastStatus})` : ""} · {relativeTime(t.lastRunAt)}</p>
              <p className="mt-1 text-red-600">Suggestion: check auth headers and base URL in the API Lab; add a timeout + fallback in your code.</p>
            </div>
          ))}
        </div>
      ) : healthy.length ? (
        <p className="mt-3 text-xs text-ink-500">{healthy.length} test case{healthy.length === 1 ? "" : "s"} passing across {apis.length} registered API{apis.length === 1 ? "" : "s"}. Keep an eye on latency as you add integrations.</p>
      ) : (
        <p className="mt-3 text-xs text-ink-400">Register APIs and run tests in the API Lab — repeated failures will surface warnings here automatically.</p>
      )}
    </Card>
  );
}
