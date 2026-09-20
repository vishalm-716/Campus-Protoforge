"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

export function AgentActions({ challengeId, canReview }: { challengeId: string; canReview: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function run(kind: "structure" | "track") {
    setBusy(kind);
    setMessage("");
    let ok = false;
    try {
      if (kind === "structure") {
        const res = await fetch("/api/agents/structure-challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId }),
        });
        const data = await res.json();
        setMessage(res.ok ? `Brief structured via ${data.engine}` : data.error ?? "Failed");
        ok = res.ok;
      } else {
        const res = await fetch("/api/agents/generate-track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId }),
        });
        const data = await res.json();
        setMessage(res.ok ? `Track generated via ${data.engine}` : data.error ?? "Failed");
        ok = res.ok;
      }
      if (ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={() => run("structure")} disabled={busy !== null}>
        {busy === "structure" ? "Structuring…" : "🧩 Run Idea Structurer"}
      </Button>
      <Button variant="outline" onClick={() => run("track")} disabled={busy !== null}>
        {busy === "track" ? "Generating…" : "🗺️ Generate Prototype Track"}
      </Button>
      {message ? <span className="text-xs text-ink-500">{message}</span> : null}
    </div>
  );
}
