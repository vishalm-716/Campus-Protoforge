"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "./ui";
import { DEPARTMENTS, DIFFICULTIES, CHALLENGE_KINDS } from "@/lib/constants";

const KIND_LABELS: Record<string, string> = {
  student_idea: "Student idea",
  official_course: "Official course challenge",
  lab: "Lab challenge",
  capstone: "Capstone",
};

export function CreateChallengeForm({ role, defaultDepartment }: { role: string; defaultDepartment?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    rawDescription: "",
    domainTags: "",
    courseTag: "",
    department: defaultDepartment ?? "",
    difficulty: "intermediate",
    expectedImpact: "",
    kind: role === "student" ? "student_idea" : "official_course",
    autoStructure: true,
  });

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          rawDescription: form.rawDescription,
          domainTags: form.domainTags.split(",").map((s) => s.trim()).filter(Boolean),
          courseTag: form.courseTag || undefined,
          department: form.department || undefined,
          difficulty: form.difficulty,
          expectedImpact: form.expectedImpact || undefined,
          kind: form.kind,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create challenge");
        return;
      }
      if (form.autoStructure) {
        await fetch("/api/agents/structure-challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId: data.challenge.id }),
        });
      }
      router.push(`/challenges/${data.challenge.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-bold text-ink-900">Submit a challenge</h2>
      <p className="mt-1 text-sm text-ink-500">Describe the idea in plain words — the Idea Structurer agent will draft a standardized brief you can edit.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="c-title" className="mb-1.5 block text-sm font-medium text-ink-700">Title</label>
          <Input id="c-title" required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Smart canteen queue predictor" />
        </div>
        <div>
          <label htmlFor="c-desc" className="mb-1.5 block text-sm font-medium text-ink-700">Raw description</label>
          <Textarea id="c-desc" required rows={5} value={form.rawDescription} onChange={(e) => set("rawDescription", e.target.value)} placeholder="What's the problem? Who faces it? What would a working solution look like?" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="c-tags" className="mb-1.5 block text-sm font-medium text-ink-700">Domain tags</label>
            <Input id="c-tags" value={form.domainTags} onChange={(e) => set("domainTags", e.target.value)} placeholder="IoT, React, ML" />
          </div>
          <div>
            <label htmlFor="c-dept" className="mb-1.5 block text-sm font-medium text-ink-700">Department</label>
            <Select id="c-dept" value={form.department} onChange={(e) => set("department", e.target.value)}>
              <option value="">Interdisciplinary</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
          <div>
            <label htmlFor="c-diff" className="mb-1.5 block text-sm font-medium text-ink-700">Difficulty</label>
            <Select id="c-diff" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
          <div>
            <label htmlFor="c-kind" className="mb-1.5 block text-sm font-medium text-ink-700">Kind</label>
            <Select id="c-kind" value={form.kind} onChange={(e) => set("kind", e.target.value)}>
              {CHALLENGE_KINDS.map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="c-course" className="mb-1.5 block text-sm font-medium text-ink-700">Course tag (optional)</label>
            <Input id="c-course" value={form.courseTag} onChange={(e) => set("courseTag", e.target.value)} placeholder="CS302 — Human-Computer Interaction" />
          </div>
          <div>
            <label htmlFor="c-impact" className="mb-1.5 block text-sm font-medium text-ink-700">Expected impact (optional)</label>
            <Input id="c-impact" value={form.expectedImpact} onChange={(e) => set("expectedImpact", e.target.value)} placeholder="Cut canteen wait times by half during peak hours" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" checked={form.autoStructure} onChange={(e) => set("autoStructure", e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400" />
          Run the Idea Structurer agent right after submitting
        </label>
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
        <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit challenge"}</Button>
      </form>
    </Card>
  );
}
