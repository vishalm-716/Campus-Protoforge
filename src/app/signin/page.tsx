"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Select } from "@/components/ui";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Sign in failed");
      return;
    }
    const data = await res.json();
    if (data.role === "faculty") router.push("/dashboard?view=faculty");
    else if (data.role === "admin") router.push("/dashboard?view=admin");
    else router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md p-8">
      <h1 className="font-display text-2xl font-bold text-ink-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-500">Sign in to your ProtoForge studio.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@campus.edu" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-700">Password</label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </div>
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-500">
        New here? <Link href="/signup" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
      </p>
      <div className="mt-5 rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
        <p className="font-semibold text-ink-600">Demo accounts</p>
        <p className="mt-1">student@campus.edu · faculty@campus.edu · admin@campus.edu</p>
        <p>Password for all: <code className="rounded bg-white px-1">demo123</code></p>
      </div>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
