"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

export function PublishAssetActions({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function publish() {
    setBusy(true);
    await fetch("/api/learning-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <Button variant="primary" className="px-3 py-1.5 text-xs" onClick={publish} disabled={busy}>
      {busy ? "Publishing…" : "🎓 Graduate"}
    </Button>
  );
}
