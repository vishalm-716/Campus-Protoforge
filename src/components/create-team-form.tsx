"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "./ui";

interface ChallengeOption {
  id: string;
  title: string;
  tracks: { id: string; level: string }[];
}

export function CreateTeamForm({ challenges, preselected }: { challenges: ChallengeOption[]; preselected?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [challengeId, setChallengeId] = useState(preselected ?? challenges[0]?.id ?? "");
  const [trackId, setTrackId] = useState(preselected ? undefined : challenges[0]?.tracks[0]?.id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = challenges.find((c) => c.id === challengeId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, challengeId, prototypeTrackId: trackId || selected?.tracks[0]?.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create team");
        return;
      }
      router.push(`/dashboard/teams/${data.team.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!challenges.length) {
    return (
      <Card className="p-6 text-sm text-ink-500">
        No challenges with prototype tracks yet. Generate a track on a challenge first, then come back to form a team.
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-bold text-ink-900">Form a team</h2>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="t-name" className="mb-1.5 block text-sm font-medium text-ink-700">Team name</label>
          <Input id="t-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Queue Ninjas" />
        </div>
        <div>
          <label htmlFor="t-challenge" className="mb-1.5 block text-sm font-medium text-ink-700">Challenge</label>
          <Select
            id="t-challenge"
            value={challengeId}
            onChange={(e) => {
              setChallengeId(e.target.value);
              setTrackId(undefined);
            }}
          >
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="t-track" className="mb-1.5 block text-sm font-medium text-ink-700">Prototype track</label>
          <Select id="t-track" value={trackId ?? selected?.tracks[0]?.id ?? ""} onChange={(e) => setTrackId(e.target.value)}>
            {selected?.tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.level} track</option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-3">
          {error ? <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
          <Button type="submit" disabled={busy || !challengeId}>{busy ? "Creating…" : "Create team & open workspace"}</Button>
        </div>
      </form>
    </Card>
  );
}
