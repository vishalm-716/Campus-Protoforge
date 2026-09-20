"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui";

const NAV = {
  student: [
    { href: "/dashboard", label: "Home", icon: "🏠" },
    { href: "/dashboard/challenges", label: "Browse Challenges", icon: "🧭" },
    { href: "/dashboard/teams", label: "My Teams", icon: "👥" },
    { href: "/dashboard/registry", label: "API Registry", icon: "🔌" },
    { href: "/dashboard/library", label: "Learning Library", icon: "🎓" },
  ],
  faculty: [
    { href: "/dashboard", label: "Overview", icon: "🏠" },
    { href: "/dashboard/challenges", label: "Challenges", icon: "🧭" },
    { href: "/dashboard/teams", label: "Teams & Review", icon: "👥" },
    { href: "/dashboard/risk", label: "Risk Radar", icon: "🚨" },
    { href: "/dashboard/registry", label: "API Registry", icon: "🔌" },
    { href: "/dashboard/library", label: "Learning Library", icon: "🎓" },
  ],
  admin: [
    { href: "/dashboard", label: "Analytics", icon: "📊" },
    { href: "/dashboard/challenges", label: "Challenges", icon: "🧭" },
    { href: "/dashboard/teams", label: "Teams", icon: "👥" },
    { href: "/dashboard/risk", label: "Risk Radar", icon: "🚨" },
    { href: "/dashboard/registry", label: "API Registry", icon: "🔌" },
    { href: "/dashboard/agents", label: "Agent Config", icon: "⚙️" },
    { href: "/dashboard/library", label: "Learning Library", icon: "🎓" },
  ],
} as const;

export function DashboardShell({ user, children }: { user: { id: string; name: string; email: string; role: string; avatar?: string | null }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = NAV[user.role as keyof typeof NAV] ?? NAV.student;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/60 bg-white/70 backdrop-blur-xl lg:flex">
        <Link href="/" className="flex h-16 items-center gap-2.5 px-5 font-display text-base font-bold text-ink-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm text-white">⚙️</span>
          Campus <span className="text-brand-600">ProtoForge</span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-100/60 hover:text-ink-900",
                )}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink-100/70 p-4">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} src={user.avatar} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-800">{user.name}</p>
              <p className="truncate text-[11px] capitalize text-ink-400">{user.role}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link href="/dashboard/profile" className="flex-1 rounded-lg border border-ink-200 px-2 py-1.5 text-center text-xs font-medium text-ink-600 hover:border-brand-300">Profile</Link>
            <button onClick={logout} className="flex-1 rounded-lg border border-ink-200 px-2 py-1.5 text-xs font-medium text-ink-600 hover:border-red-300 hover:text-red-600">Sign out</button>
          </div>
        </div>
      </aside>
      <div className="flex min-h-screen w-full flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/60 bg-white/70 px-4 backdrop-blur-xl lg:hidden">
          <Link href="/dashboard" className="font-display font-bold text-ink-900">ProtoForge</Link>
          <button onClick={logout} className="ml-auto rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium">Sign out</button>
        </header>
        <div className="flex gap-2 overflow-x-auto px-4 py-2 lg:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full border border-ink-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-ink-600">
              {item.label}
            </Link>
          ))}
        </div>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
