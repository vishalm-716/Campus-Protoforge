"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Select } from "@/components/ui";
import { DEPARTMENTS } from "@/lib/constants";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    year: "2",
    skills: "",
    preferredStack: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department || undefined,
        year: form.role === "student" ? Number(form.year) || undefined : undefined,
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        preferredStack: form.preferredStack || undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registration failed");
      return;
    }
    // Auto sign-in
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, password: form.password }),
    });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-8">
        <h1 className="font-display text-2xl font-bold text-ink-900">Join the studio</h1>
        <p className="mt-1.5 text-sm text-ink-500">Create your account and pick your role.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink-700">Full name</label>
              <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ada Lovelace" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@campus.edu" />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-700">Password</label>
            <Input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-ink-700">I am a</label>
              <Select id="role" value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <div>
              <label htmlFor="department" className="mb-1.5 block text-sm font-medium text-ink-700">Department</label>
              <Select id="department" value={form.department} onChange={(e) => set("department", e.target.value)}>
                <option value="">Select…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </div>
            {form.role === "student" ? (
              <div>
                <label htmlFor="year" className="mb-1.5 block text-sm font-medium text-ink-700">Year</label>
                <Select id="year" value={form.year} onChange={(e) => set("year", e.target.value)}>
                  {[1, 2, 3, 4, 5].map((y) => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </Select>
              </div>
            ) : (
              <div />
            )}
          </div>
          <div>
            <label htmlFor="skills" className="mb-1.5 block text-sm font-medium text-ink-700">Skills (comma separated)</label>
            <Input id="skills" value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="React, Python, Figma, ML basics" />
          </div>
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating account…" : "Create account"}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-500">
          Already have an account? <Link href="/signin" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
        </p>
      </Card>
    </main>
  );
}
