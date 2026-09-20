"use client";

import { useState } from "react";
import { Card, Button, Badge, Textarea, Select } from "./ui";

export function AgentConfigForm({ config }: { config: { agentName: string; enabled: boolean; maxAutonomy: string; systemPrompt: string } }) {
  const [enabled, setEnabled] = useState(config.enabled);
  const [autonomy, setAutonomy] = useState(config.maxAutonomy);
  const [prompt, setPrompt] = useState(config.systemPrompt);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    await fetch("/api/agent-configs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentName: config.agentName, enabled, maxAutonomy: autonomy, systemPrompt: prompt }),
    });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-800">{config.agentName}</h3>
        <label className="flex items-center gap-1.5 text-xs text-ink-500">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600" />
          enabled
        </label>
      </div>
      <div className="mt-3 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-500" htmlFor={`autonomy-${config.agentName}`}>Max autonomy</label>
          <Select id={`autonomy-${config.agentName}`} value={autonomy} onChange={(e) => setAutonomy(e.target.value)} className="text-sm">
            <option value="suggest">Suggest only</option>
            <option value="act_with_review">Act with review</option>
            <option value="act">Autonomous</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-500" htmlFor={`prompt-${config.agentName}`}>System prompt addendum</label>
          <Textarea id={`prompt-${config.agentName}`} rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Extra instructions appended to this agent's system prompt…" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          {saved ? <Badge tone="green">saved</Badge> : null}
        </div>
      </div>
    </Card>
  );
}
