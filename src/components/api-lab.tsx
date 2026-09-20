"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Badge, Input, Select, Textarea, EmptyState } from "./ui";
import { parseJson, relativeTime } from "@/lib/utils";
import { REGISTRY_CATEGORIES, API_AUTH_TYPES } from "@/lib/constants";

interface ApiDto {
  id: string;
  name: string;
  baseUrl: string;
  description: string;
  authType: string;
  authConfig: string;
  exampleEndpoints: string;
  category: string;
  tags: string;
  registryStatus: string;
  docsUrl: string | null;
  repoUrl: string | null;
  usageCount: number;
  testCases: {
    id: string;
    name: string;
    method: string;
    path: string;
    expectedStatus: number;
    lastStatus: number | null;
    lastDurationMs: number | null;
    lastRunAt: string | null;
    consecutiveFailures: number;
    milestoneId: string | null;
  }[];
}

interface MilestoneOption {
  id: string;
  title: string;
}

interface TestResult {
  status: number;
  durationMs: number;
  body: string;
  passed: boolean;
}

export function ApiLab({ teamId, apis, milestones, canEdit }: { teamId: string; apis: ApiDto[]; milestones: MilestoneOption[]; canEdit: boolean }) {
  const router = useRouter();
  const [showRegister, setShowRegister] = useState(false);
  const [testingApi, setTestingApi] = useState<ApiDto | null>(null);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h3 className="font-display text-lg font-bold text-ink-900">🧪 API Lab</h3>
          <p className="mt-0.5 text-xs text-ink-400">Register the external / student-built APIs your prototype consumes, test them, and save passing requests as reusable cases.</p>
        </div>
        {canEdit ? (
          <Button onClick={() => setShowRegister((s) => !s)}>{showRegister ? "Close" : "＋ Register API"}</Button>
        ) : null}
      </Card>

      {showRegister && canEdit ? <RegisterForm teamId={teamId} onDone={() => { setShowRegister(false); router.refresh(); }} /> : null}

      {apis.length === 0 ? (
        <EmptyState title="No APIs registered" sub="Add your team's external APIs — weather, maps, sports data, or your own microservices — to unlock coach integration ideas and the architecture view." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {apis.map((api) => {
            const endpoints = parseJson<{ method: string; path: string; description?: string }[]>(api.exampleEndpoints, []);
            const tags = parseJson<string[]>(api.tags, []);
            const failing = api.testCases.filter((t) => t.consecutiveFailures >= 2).length;
            return (
              <Card key={api.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-display text-base font-bold text-ink-900">{api.name}</h4>
                    <code className="mt-1 block truncate text-[11px] text-ink-400">{api.baseUrl}</code>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone="brand">{api.category}</Badge>
                    {api.registryStatus !== "draft" ? <Badge tone={api.registryStatus === "approved" ? "green" : api.registryStatus === "pending" ? "amber" : "red"}>{api.registryStatus}</Badge> : null}
                  </div>
                </div>
                {api.description ? <p className="mt-2 text-xs text-ink-500">{api.description}</p> : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={api.authType === "none" ? "gray" : "amber"}>auth: {api.authType}</Badge>
                  {tags.slice(0, 3).map((t) => <Badge key={t} tone="gray">#{t}</Badge>)}
                </div>

                {endpoints.length ? (
                  <div className="mt-3 space-y-1">
                    {endpoints.map((e, i) => (
                      <p key={i} className="truncate text-[11px] text-ink-400">
                        <span className="font-mono font-semibold text-emerald-600">{e.method}</span> {e.path}{e.description ? ` — ${e.description}` : ""}
                      </p>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => setTestingApi(testingApi?.id === api.id ? null : api)}>
                    🧪 Test endpoint
                  </Button>
                  {api.docsUrl ? <a href={api.docsUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl px-3 py-1.5 text-xs font-semibold text-brand-600 hover:underline">Docs ↗</a> : null}
                  {api.repoUrl ? <a href={api.repoUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl px-3 py-1.5 text-xs font-semibold text-brand-600 hover:underline">GitHub ↗</a> : null}
                  <span className="ml-auto text-[11px] text-ink-400">{api.usageCount} runs</span>
                </div>

                {testingApi?.id === api.id ? <TestForm teamId={teamId} api={api} milestones={milestones} canEdit={canEdit} onDone={() => router.refresh()} /> : null}

                {/* Saved test cases */}
                {api.testCases.length ? (
                  <div className="mt-4 border-t border-ink-100/70 pt-3">
                    <p className="text-xs font-semibold text-ink-600">Saved test cases {failing ? <Badge tone="red" className="ml-1">{failing} failing</Badge> : null}</p>
                    <ul className="mt-2 space-y-1.5">
                      {api.testCases.slice(0, 4).map((tc) => (
                        <li key={tc.id} className="flex items-center justify-between gap-2 rounded-lg bg-ink-50/70 px-3 py-1.5 text-[11px]">
                          <span className="truncate font-medium text-ink-700">
                            <span className={`font-mono ${tc.method === "GET" ? "text-emerald-600" : "text-brand-600"}`}>{tc.method}</span> {tc.path}
                            {tc.milestoneId ? <span className="text-ink-400"> · 📍 attached</span> : null}
                          </span>
                          <span className={tc.consecutiveFailures > 0 ? "font-semibold text-red-500" : "font-semibold text-emerald-600"}>
                            {tc.lastStatus ?? "—"} {tc.lastDurationMs !== null ? `· ${tc.lastDurationMs}ms` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RegisterForm({ teamId, onDone }: { teamId: string; onDone: () => void }) {
  const [form, setForm] = useState({ name: "", baseUrl: "", description: "", authType: "none", category: "utilities", tags: "", docsUrl: "", repoUrl: "", submitToRegistry: false });
  const [endpointsText, setEndpointsText] = useState("GET /v1/endpoint — describe what it returns");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const endpoints = endpointsText
      .split("\n")
      .map((line) => {
        const m = line.match(/(GET|POST|PUT|PATCH|DELETE)\s+(\S+)\s*(?:—\s*(.*))?/);
        return m ? { method: m[1], path: m[2], description: m[3] ?? "" } : null;
      })
      .filter(Boolean);

    const res = await fetch("/api/external-apis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        name: form.name,
        baseUrl: form.baseUrl,
        description: form.description,
        authType: form.authType,
        category: form.category,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        docsUrl: form.docsUrl || undefined,
        repoUrl: form.repoUrl || undefined,
        exampleEndpoints: endpoints,
        submitToRegistry: form.submitToRegistry,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to register API");
      return;
    }
    onDone();
  }

  return (
    <Card className="p-5">
      <h4 className="text-sm font-bold text-ink-800">Register an API</h4>
      <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
        <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="API name (e.g. Campus Weather Gateway)" aria-label="API name" />
        <Input required value={form.baseUrl} onChange={(e) => set("baseUrl", e.target.value)} placeholder="https://api.example.com" aria-label="Base URL" />
        <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What does this API do?" className="sm:col-span-2" aria-label="Description" />
        <Select value={form.authType} onChange={(e) => set("authType", e.target.value)} aria-label="Auth type">
          {API_AUTH_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
        <Select value={form.category} onChange={(e) => set("category", e.target.value)} aria-label="Category">
          {REGISTRY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="tags, comma separated" className="sm:col-span-2" aria-label="Tags" />
        <Textarea rows={3} value={endpointsText} onChange={(e) => setEndpointsText(e.target.value)} placeholder={"GET /v1/endpoint — description (one per line)"} className="sm:col-span-2 font-mono text-xs" aria-label="Example endpoints" />
        <Input value={form.docsUrl} onChange={(e) => set("docsUrl", e.target.value)} placeholder="Docs URL (optional)" aria-label="Docs URL" />
        <Input value={form.repoUrl} onChange={(e) => set("repoUrl", e.target.value)} placeholder="GitHub repo (optional)" aria-label="Repo URL" />
        <label className="flex items-center gap-2 text-sm text-ink-600 sm:col-span-2">
          <input type="checkbox" checked={form.submitToRegistry} onChange={(e) => set("submitToRegistry", e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
          Submit to the campus API Registry (faculty review required)
        </label>
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2" role="alert">{error}</p> : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>{busy ? "Registering…" : "Register API"}</Button>
        </div>
      </form>
    </Card>
  );
}

function TestForm({ teamId, api, milestones, canEdit, onDone }: { teamId: string; api: ApiDto; milestones: MilestoneOption[]; canEdit: boolean; onDone: () => void }) {
  const [path, setPath] = useState("/");
  const [method, setMethod] = useState("GET");
  const [headersText, setHeadersText] = useState(api.authType === "api_key" ? '{"x-api-key": "YOUR_KEY"}' : "{}");
  const [body, setBody] = useState("");
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [saveCase, setSaveCase] = useState(true);
  const [milestoneId, setMilestoneId] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(headersText || "{}");
    } catch {
      setErrorMsg("Headers must be valid JSON");
      setBusy(false);
      return;
    }
    const res = await fetch("/api/api-lab/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId,
        apiId: api.id,
        milestoneId: milestoneId || undefined,
        name: `${method} ${path}`,
        method,
        url: path,
        headers,
        body: body || null,
        expectedStatus,
        save: saveCase && canEdit,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setResult(data);
    else setResult({ status: 0, durationMs: 0, body: data.error ?? "Request failed", passed: false });
    onDone();
  }

  const [errorMsg, setErrorMsg] = useState("");

  return (
    <form onSubmit={run} className="mt-4 space-y-2.5 rounded-xl border border-ink-100/80 bg-white/60 p-4">
      <div className="flex gap-2">
        <Select value={method} onChange={(e) => setMethod(e.target.value)} className="w-28" aria-label="HTTP method">
          {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/v1/resource (added to base URL)" className="flex-1 font-mono text-xs" aria-label="Path" />
        <Input type="number" value={expectedStatus} onChange={(e) => setExpectedStatus(Number(e.target.value))} className="w-20" aria-label="Expected status" />
      </div>
      <Input value={headersText} onChange={(e) => setHeadersText(e.target.value)} placeholder='{"x-api-key": "..."}' className="font-mono text-xs" aria-label="Headers JSON" />
      {!["GET", "HEAD"].includes(method) ? (
        <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"optional": "request body"}' className="font-mono text-xs" aria-label="Request body" />
      ) : null}
      {canEdit ? (
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={saveCase} onChange={(e) => setSaveCase(e.target.checked)} className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600" />
            Save as test case if it passes
          </label>
          <label className="flex items-center gap-1.5">
            📍 attach to
            <Select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} className="w-44 py-1 text-xs" aria-label="Attach to milestone">
              <option value="">— no milestone —</option>
              {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </Select>
          </label>
        </div>
      ) : null}
      {errorMsg ? <p className="text-xs text-red-600">{errorMsg}</p> : null}
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Running…" : "▶ Run request"}</Button>
      {result ? (
        <div className={`rounded-xl p-3.5 text-xs ${result.passed ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          <p className="font-semibold">{result.passed ? "✓ Passed" : "✗ Failed"} — HTTP {result.status} · {result.durationMs}ms</p>
          <pre className="scroll-thin mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono">{result.body}</pre>
        </div>
      ) : null}
    </form>
  );
}
