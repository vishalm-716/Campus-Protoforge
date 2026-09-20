"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

export function RegistryReviewActions({ apiId }: { apiId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    await fetch(`/api/registry/${apiId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button variant="primary" className="px-3 py-1.5 text-xs" onClick={() => decide("approved")} disabled={busy}>Approve</Button>
      <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => decide("rejected")} disabled={busy}>Reject</Button>
    </div>
  );
}
