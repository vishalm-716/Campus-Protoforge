"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Badge, EmptyState } from "./ui";
import { parseJson } from "@/lib/utils";
import type { PitchDocs } from "@/lib/types";

export function DocsPanel({ team }: { team: { id: string; pitchDocs: string | null; name: string } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState<string | null>(null);

  const docs = parseJson<PitchDocs | null>(team.pitchDocs, null);

  async function generate() {
    setBusy(true);
    const res = await fetch("/api/agents/pitch-docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: team.id }),
    });
    const data = await res.json().catch(() => ({}));
    setEngine(res.ok ? data.engine : null);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h3 className="font-display text-lg font-bold text-ink-900">🎤 Documentation & Pitch</h3>
          <p className="mt-0.5 text-xs text-ink-400">Generates a README outline (with your own API snippets), a one-page summary, and a 2–3 minute pitch script.</p>
        </div>
        <Button onClick={generate} disabled={busy}>{busy ? "Forging docs…" : docs ? "Regenerate" : "Generate docs & pitch"}</Button>
      </Card>

      {!docs ? (
        <EmptyState title="No docs generated yet" sub="Run the Docs & Pitch agent — it reads your challenge, milestones, artefacts, and registered APIs." />
      ) : (
        <>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-ink-800">One-page summary</h4>
              {docs.source ? <Badge tone="violet">{docs.source}</Badge> : null}
            </div>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div><dt className="font-semibold text-ink-700">Problem</dt><dd className="mt-0.5 text-ink-500">{docs.onePageSummary.problem}</dd></div>
              <div><dt className="font-semibold text-ink-700">Solution</dt><dd className="mt-0.5 text-ink-500">{docs.onePageSummary.solution}</dd></div>
              <div><dt className="font-semibold text-ink-700">Tech stack</dt><dd className="mt-0.5 text-ink-500">{docs.onePageSummary.techStack?.join(", ") || "—"}</dd></div>
              <div><dt className="font-semibold text-ink-700">Impact</dt><dd className="mt-0.5 text-ink-500">{docs.onePageSummary.impact}</dd></div>
            </dl>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h4 className="text-sm font-bold text-ink-800">README outline</h4>
              <pre className="scroll-thin mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-ink-900 p-4 text-xs leading-relaxed text-ink-100">{docs.readmeOutline?.join("\n")}</pre>
            </Card>
            <Card className="p-5">
              <h4 className="text-sm font-bold text-ink-800">Pitch script (2–3 min)</h4>
              <ol className="mt-3 space-y-2">
                {docs.pitchScript?.map((line, i) => (
                  <li key={i} className="rounded-xl border border-ink-100/80 bg-white/60 px-3.5 py-2 text-sm text-ink-600">{line}</li>
                ))}
              </ol>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
