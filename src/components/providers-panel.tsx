"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button, Badge, Input, Select } from "./ui";
import { LLM_PROVIDERS } from "@/lib/constants";

interface ProviderDto {
  id: string;
  provider: string;
  label: string;
  model: string;
  agentScope: string;
  keyMasked: string;
  createdAt: string;
}

const SCOPES = [
  { value: "all", label: "All agents" },
  { value: "structure", label: "Idea Structurer" },
  { value: "track", label: "Track Generator" },
  { value: "coach", label: "Prototype Coach" },
  { value: "feedback", label: "Feedback Agent" },
  { value: "docs", label: "Docs & Pitch" },
];

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  mistral: "mistral-small-latest",
  gemini: "gemini-1.5-flash",
  xai: "grok-2-latest",
};

export function ProvidersPanel({ teamId }: { teamId: string }) {
  const [providers, setProviders] = useState<ProviderDto[]>([]);
  const [form, setForm] = useState({ provider: "openai", label: "", apiKey: "", model: DEFAULT_MODELS.openai, agentScope: "all" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/providers?teamId=${teamId}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setProviders(data.providers ?? []);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to add provider");
      return;
    }
    setForm({ provider: "openai", label: "", apiKey: "", model: DEFAULT_MODELS.openai, agentScope: "all" });
    setNotice("Provider saved — keys are encrypted at rest and never leave the server.");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/providers?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="font-display text-lg font-bold text-ink-900">🔑 AI Providers (BYOK)</h3>
        <p className="mt-1 text-xs text-ink-400">
          Bring your own key for OpenAI, Groq, Mistral, Gemini, or xAI. Keys are AES-256-GCM encrypted server-side and never exposed to the browser.
          Agent-scoped keys override the team-wide default.
        </p>
        <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={form.provider}
            onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value, model: DEFAULT_MODELS[e.target.value] ?? f.model }))}
            aria-label="Provider"
          >
            {LLM_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Input required type="password" value={form.apiKey} onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder="API key" autoComplete="off" aria-label="API key" />
          <Input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="Model" aria-label="Model" />
          <Select value={form.agentScope} onChange={(e) => setForm((f) => ({ ...f, agentScope: e.target.value }))} aria-label="Agent scope">
            {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <div className="sm:col-span-2 lg:col-span-4">
            {error ? <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
            {notice ? <p className="mb-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "＋ Add provider"}</Button>
          </div>
        </form>
      </Card>

      {providers.length === 0 ? (
        <Card className="p-6 text-sm text-ink-500">
          No custom providers yet — agents run on built-in heuristic engines (fully functional offline). Add a key above to switch any agent to live LLM reasoning.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {providers.map((p) => (
            <Card key={p.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-bold text-ink-800 capitalize">{p.provider} <span className="ml-1 font-normal text-ink-400">{p.model}</span></p>
                <p className="mt-0.5 text-[11px] text-ink-400">
                  {SCOPES.find((s) => s.value === p.agentScope)?.label ?? p.agentScope} · key {p.keyMasked}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="green">active</Badge>
                <button onClick={() => remove(p.id)} className="text-xs text-ink-300 hover:text-red-500" aria-label={`Remove ${p.provider}`}>✕</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
