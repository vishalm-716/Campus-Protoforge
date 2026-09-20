import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Avatar } from "./ui";

export async function Navbar() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6" aria-label="Main">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold text-ink-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm text-white shadow-md">⚙️</span>
          Campus <span className="text-brand-600">ProtoForge</span>
        </Link>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <Link href="/challenges" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:text-brand-700 sm:block">Challenges</Link>
          <Link href="/registry" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:text-brand-700 sm:block">API Registry</Link>
          <Link href="/library" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:text-brand-700 sm:block">Library</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700">
                Dashboard
              </Link>
              <Link href="/dashboard/profile" aria-label="Profile">
                <Avatar name={user.name} src={user.avatar} size={34} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/signin" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:text-brand-700">Sign in</Link>
              <Link href="/signup" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700">Get started</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
