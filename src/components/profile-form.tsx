"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea } from "./ui";
import { DEPARTMENTS } from "@/lib/constants";
import { parseJson } from "@/lib/utils";

export function ProfileForm({ user }: { user: { name: string; email: string; role: string; department: string; year?: number; skills: string; preferredStack: string } }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name,
    department: user.department,
    year: user.year ? String(user.year) : "",
    skills: parseJson<string[]>(user.skills, []).join(", "),
    preferredStack: user.preferredStack,
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        department: form.department || undefined,
        year: user.role === "student" && form.year ? Number(form.year) : undefined,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        preferredStack: form.preferredStack || undefined,
      }),
    });
    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-name" className="mb-1.5 block text-sm font-medium text-ink-700">Name</label>
          <Input id="p-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="p-email" className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
          <Input id="p-email" value={user.email} disabled />
        </div>
        <div>
          <label htmlFor="p-dept" className="mb-1.5 block text-sm font-medium text-ink-700">Department</label>
          <Select id="p-dept" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
            <option value="">Interdisciplinary</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
        {user.role === "student" ? (
          <div>
            <label htmlFor="p-year" className="mb-1.5 block text-sm font-medium text-ink-700">Year</label>
            <Select id="p-year" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}>
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Select>
          </div>
        ) : null}
      </div>
      <div>
        <label htmlFor="p-skills" className="mb-1.5 block text-sm font-medium text-ink-700">Skills (comma separated)</label>
        <Input id="p-skills" value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} placeholder="React, Python, Figma" />
      </div>
      <div>
        <label htmlFor="p-stack" className="mb-1.5 block text-sm font-medium text-ink-700">Preferred stack / courses</label>
        <Textarea id="p-stack" rows={2} value={form.preferredStack} onChange={(e) => setForm((f) => ({ ...f, preferredStack: e.target.value }))} placeholder="Next.js + SQLite; completed CS201, CS305" />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
        {saved ? <span className="text-sm font-medium text-emerald-600">Saved ✓</span> : null}
      </div>
    </form>
  );
}
