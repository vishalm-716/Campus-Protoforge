import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export function Card({ children, className, hover, glow }: { children: ReactNode; className?: string; hover?: boolean; glow?: "brand" | "mint" | "amber" }) {
  return (
    <div
      className={cn(
        "glass rounded-2xl",
        hover && "card-3d",
        glow === "brand" && "glow-brand",
        glow === "mint" && "glow-mint",
        glow === "amber" && "glow-amber",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Large hero-grade glass panel with a gradient top edge. */
export function GlassPanel({ children, className, edge = "brand" }: { children: ReactNode; className?: string; edge?: "brand" | "accent" | "mint" }) {
  const edges: Record<string, string> = {
    brand: "from-brand-400/80 via-brand-300/40 to-transparent",
    accent: "from-accent-400/80 via-accent-400/30 to-transparent",
    mint: "from-mint-400/80 via-mint-400/30 to-transparent",
  };
  return (
    <div className={cn("glass-strong relative overflow-hidden rounded-3xl", className)}>
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r", edges[edge])} aria-hidden />
      {children}
    </div>
  );
}

/** Small pill for status/agent chips with a soft inner glow. */
export function Chip({ children, tone = "brand", className, dot }: { children: ReactNode; tone?: "brand" | "green" | "amber" | "gray" | "violet"; className?: string; dot?: boolean }) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50/80 text-brand-700 ring-1 ring-brand-200/70",
    green: "bg-emerald-50/80 text-emerald-700 ring-1 ring-emerald-200/70",
    amber: "bg-amber-50/80 text-amber-700 ring-1 ring-amber-200/70",
    gray: "bg-ink-100/70 text-ink-600 ring-1 ring-ink-200/70",
    violet: "bg-violet-50/80 text-violet-700 ring-1 ring-violet-200/70",
  };
  const dots: Record<string, string> = {
    brand: "bg-brand-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    gray: "bg-ink-400",
    violet: "bg-violet-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", tones[tone], className)}>
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} aria-hidden /> : null}
      {children}
    </span>
  );
}

export function SectionTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p> : null}
      <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h2>
      {sub ? <p className="mt-2 max-w-2xl text-sm text-ink-500">{sub}</p> : null}
    </div>
  );
}

type ButtonVariant = "primary" | "ghost" | "outline" | "danger" | "accent";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-[0_8px_20px_-8px_rgba(71,79,224,0.55)]",
  accent: "bg-accent-500 text-white hover:bg-accent-600 shadow-[0_8px_20px_-8px_rgba(233,138,60,0.55)]",
  ghost: "text-ink-700 hover:bg-ink-100",
  outline: "border border-ink-200 bg-white/60 text-ink-800 hover:border-brand-300 hover:text-brand-700",
  danger: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
};

export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50",
        buttonStyles[variant],
        className,
      )}
    />
  );
}

export function LinkButton({ href, variant = "primary", className, children, prefetch }: { href: string; variant?: ButtonVariant; className?: string; children: ReactNode; prefetch?: boolean }) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
        buttonStyles[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100",
        className,
      )}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100",
        className,
      )}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full appearance-none rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100",
        className,
      )}
    >
      {children}
    </select>
  );
}

export function Badge({ children, tone = "brand", className }: { children: ReactNode; tone?: "brand" | "green" | "amber" | "red" | "gray" | "violet"; className?: string }) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700 border-brand-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-ink-100 text-ink-600 border-ink-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", tones[tone], className)}>{children}</span>;
}

export function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  const init = name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-label={name}
      title={name}
    >
      {init}
    </span>
  );
}

export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/40 px-6 py-12 text-center">
      <p className="font-semibold text-ink-700">{title}</p>
      {sub ? <p className="mt-1 max-w-sm text-sm text-ink-500">{sub}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-ink-100", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: "brand" | "green" | "amber" | "red" | "gray" | "violet"; label: string }> = {
    open: { tone: "brand", label: "Open" },
    in_progress: { tone: "amber", label: "In progress" },
    completed: { tone: "green", label: "Completed" },
    archived: { tone: "gray", label: "Archived" },
    todo: { tone: "gray", label: "To do" },
    done: { tone: "green", label: "Done" },
    ai_draft: { tone: "violet", label: "AI draft" },
    approved: { tone: "green", label: "Approved" },
    pending: { tone: "amber", label: "Pending review" },
    rejected: { tone: "red", label: "Rejected" },
    draft: { tone: "gray", label: "Draft" },
  };
  const v = map[status] ?? { tone: "gray" as const, label: status };
  return <Badge tone={v.tone}>{v.label}</Badge>;
}
