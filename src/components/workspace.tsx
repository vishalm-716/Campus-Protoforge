"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, EmptyState, ProgressBar, StatusBadge, Chip } from "./ui";
import { ActivityStream } from "./activity-stream";
import { parseJson, relativeTime, formatDate } from "@/lib/utils";
import type { ChecklistItem, ChatMessage } from "@/lib/types";
import { IntegrationHealth } from "./integration-health";
import { ApiLab } from "./api-lab";
import { ProvidersPanel } from "./providers-panel";
import { ArchitectureView } from "./architecture-view";
import { DocsPanel } from "./docs-panel";
import { FeedbackPanel } from "./feedback-panel";

interface MilestoneDto {
  id: string;
  orderIndex: number;
  title: string;
  description: string;
  checklistItems: string;
  status: string;
  notes: string;
  aiSuggestions: string;
  dueDate: string | null;
}

interface TeamDto {
  id: string;
  name: string;
  notes: string;
  pitchDocs: string | null;
  challenge: { id: string; title: string; expectedImpact: string | null; domainTags: string; rawDescription: string; structuredBrief: string | null };
  track: { id: string; level: string; milestones: MilestoneDto[] } | null;
  members: { id: string; role: string; user: { id: string; name: string; avatar: string | null; department: string | null; year: number | null; skills: string } }[];
  mentor: { id: string; name: string } | null;
  artefacts: { id: string; type: string; url: string; shortDescription: string; createdAt: string; uploader: { name: string }; milestone: { title: string } | null }[];
  feedbacks: { id: string; finalised: boolean; comments: string; rubricScores: string; aiDraft: string | null; createdAt: string; faculty: { name: string }; milestone: { title: string } | null }[];
  externalApis: {
    id: string;
    name: string;
    baseUrl: string;
    description: string;
    authType: string;
    authConfig: string;
    exampleEndpoints: string;
    category: string;
    tags: string;
    registryStatus: string;
    docsUrl: string | null;
    repoUrl: string | null;
    usageCount: number;
    testCases: { id: string; name: string; method: string; path: string; expectedStatus: number; lastStatus: number | null; lastDurationMs: number | null; lastRunAt: string | null; consecutiveFailures: number; milestoneId: string | null }[];
  }[];
}

const TABS = ["Command Center", "Milestones", "Artefacts", "API Lab", "Coach", "Docs & Pitch", "Feedback", "AI Providers", "Architecture"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, string> = {
  "Command Center": "🛰️",
  Milestones: "🗺️",
  Artefacts: "📦",
  "API Lab": "🧪",
  Coach: "🤖",
  "Docs & Pitch": "🎤",
  Feedback: "📝",
  "AI Providers": "🔑",
  Architecture: "🏗️",
};

export function Workspace({ user, team }: { user: { id: string; name: string; role: string }; team: TeamDto }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Command Center");
  // Milestone context shared by the rail (Command Center + Coach) — lifted so the
  // rail selection drives the chat context everywhere.
  const [coachMilestoneId, setCoachMilestoneId] = useState<string | null>(null);

  const milestones = team.track?.milestones ?? [];
  const done = milestones.filter((m) => m.status === "done").length;
  const active = milestones.find((m) => m.status === "in_progress") ?? milestones.find((m) => m.status !== "done");
  const progress = milestones.length ? (done / milestones.length) * 100 : 0;
  const isMember = team.members.some((m) => m.user.id === user.id);
  const canReview = user.role === "faculty" || user.role === "admin";
  const failingCases = team.externalApis.flatMap((a) => a.testCases).filter((t) => t.consecutiveFailures >= 2).length;

  // Which panels render in the center column (full width) vs default grid
  const fullBleed: Tab[] = ["Architecture"];
  const wide = fullBleed.includes(tab);
  const rightRail = (
    <div className="space-y-5">
      <ActivityStream teamId={team.id} />
      <IntegrationHealth apis={team.externalApis} />
      <Card className="p-5">
        <h3 className="text-sm font-bold text-ink-800">Team notes</h3>
        <TeamNotes teamId={team.id} initial={team.notes} canEdit={isMember} />
      </Card>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ----------------------------------------------------------------- */}
      {/* Command-center header                                             */}
      {/* ----------------------------------------------------------------- */}
      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-300/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-72 rounded-full bg-accent-400/15 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-ink-900">{team.name}</h1>
              {team.track ? <Chip tone="brand" dot>{team.track.level} track</Chip> : <Chip tone="gray">no track</Chip>}
              <Chip tone="green" dot>live workspace</Chip>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Challenge:{" "}
              <a href={`/challenges/${team.challenge.id}`} className="font-medium text-brand-600 hover:underline">{team.challenge.title}</a>
              {team.mentor ? <span> · Mentor: {team.mentor.name}</span> : null}
            </p>
          </div>
          <div className="w-full max-w-xs">
            <ProgressBar value={progress} />
            <p className="mt-1 text-right text-xs text-ink-400">{done}/{milestones.length} milestones done</p>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          {team.members.map((m) => (
            <span key={m.id} className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white/70 py-1 pl-1 pr-3 text-xs font-medium text-ink-600 transition hover:border-brand-300 hover:shadow-sm">
              <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[9px] font-bold text-white">
                {m.user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              {m.user.name}{m.role === "lead" ? " ★" : ""}
            </span>
          ))}
        </div>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Tabs — glass segmented control                                    */}
      {/* ----------------------------------------------------------------- */}
      <div className="scroll-thin flex gap-1 overflow-x-auto rounded-2xl bg-white/60 p-1.5 backdrop-blur-xl" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              tab === t
                ? "bg-brand-600 text-white shadow-[0_8px_20px_-8px_rgba(71,79,224,0.6)]"
                : "text-ink-600 hover:bg-white hover:text-ink-900 hover:shadow-sm"
            }`}
          >
            <span aria-hidden className="text-xs">{TAB_ICONS[t]}</span>
            {t}
            {t === "Feedback" && team.feedbacks.some((f) => !f.finalised) ? <span className="pulse-dot ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> : null}
            {t === "API Lab" && failingCases > 0 ? <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500" /> : null}
          </button>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Body — center panel + right command rail                          */}
      {/* ----------------------------------------------------------------- */}      {wide ? (
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="fade-up xl:col-span-2">
            {tab === "Architecture" ? <Card className="p-5"><ArchitectureView apis={team.externalApis} teamName={team.name} /></Card> : null}
          </div>
          {rightRail}
        </div>
      ) : tab === "Command Center" ? (
        <CommandCenter
          team={team}
          milestones={milestones}
          active={active}
          isMember={isMember}
          selectedMilestoneId={coachMilestoneId}
          onSelectMilestone={setCoachMilestoneId}
          onNavigate={setTab}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="fade-up xl:col-span-2">
            {tab === "Milestones" ? <MilestonesPanel team={team} milestones={milestones} isMember={isMember} /> : null}
            {tab === "Artefacts" ? <ArtefactsPanel team={team} milestones={milestones} isMember={isMember} /> : null}
            {tab === "API Lab" ? <ApiLab teamId={team.id} apis={team.externalApis} milestones={milestones.map((m) => ({ id: m.id, title: m.title }))} canEdit={isMember} /> : null}
            {tab === "Coach" ? <CoachSection teamId={team.id} teamName={team.name} milestones={milestones} active={active} selectedId={coachMilestoneId} onSelect={setCoachMilestoneId} /> : null}
            {tab === "Docs & Pitch" ? <DocsPanel team={team} /> : null}
            {tab === "Feedback" ? <FeedbackPanel team={team} user={user} canReview={canReview} /> : null}
            {tab === "AI Providers" ? <ProvidersPanel teamId={team.id} /> : null}
          </div>
          {rightRail}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coach — center stage: chat + milestone context rail
// ---------------------------------------------------------------------------

function CoachSection({ teamId, teamName, milestones, active, selectedId, onSelect }: { teamId: string; teamName: string; milestones: MilestoneDto[]; active?: MilestoneDto; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const current = milestones.find((m) => m.id === selectedId) ?? active ?? milestones[0];
  const currentChecklist = current ? parseJson<ChecklistItem[]>(current.checklistItems, []) : [];
  const rawSuggestions = current ? parseJson<unknown[]>(current.aiSuggestions, []) : [];
  const labelOf = (s: unknown) => (typeof s === "string" ? s : typeof s === "object" && s !== null && "detail" in s ? String((s as { detail: unknown }).detail) : "");
  const currentInsights = rawSuggestions.map(labelOf).filter((s) => s && !s.includes("http"));

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      {/* Milestone context rail */}
      <div className="glass-deep scroll-thin max-h-[640px] space-y-2 overflow-y-auto rounded-2xl p-3">
        <p className="px-1 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">Milestone context</p>
        {milestones.map((m, i) => {
          const selected = current?.id === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(selectedId === m.id ? null : m.id)}
              className={`w-full rounded-xl px-3 py-2.5 text-left transition ${selected ? "bg-brand-600 text-white shadow-[0_8px_20px_-8px_rgba(71,79,224,0.65)]" : "text-ink-600 hover:bg-white/80"}`}
            >
              <div className="flex items-center gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${m.status === "done" ? "bg-emerald-100 text-emerald-700" : selected ? "bg-white/25 text-white" : "bg-ink-100 text-ink-500"}`}>
                  {m.status === "done" ? "✓" : i + 1}
                </span>
                <span className={`min-w-0 truncate text-xs font-semibold ${selected ? "text-white" : "text-ink-800"}`}>{m.title}</span>
              </div>
              {m.status === "in_progress" ? (
                <span className={`mt-1 block text-[10px] font-semibold ${selected ? "text-emerald-200" : "text-amber-600"}`}>● in progress</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Chat panel */}
      <div>
        <CoachChat
          teamId={teamId}
          teamName={teamName}
          milestone={current}
          checklist={currentChecklist}
          insights={currentInsights}
        />
      </div>
    </div>
  );
}

function CoachChat({ teamId, teamName, milestone, checklist, insights, compact }: { teamId: string; teamName: string; milestone?: MilestoneDto; checklist: ChecklistItem[]; insights: string[]; compact?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState<string | null>(null);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setMessages((m) => [...m, { role: "user", content: question, at: new Date().toISOString() }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/agents/prototype-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, question, milestoneId: milestone?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setEngine(data.engine);
        setMessages((m) => [...m, { role: "assistant", content: data.guidance, at: new Date().toISOString() }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${data.error ?? "Coach unavailable"}` }]);
      }
    } finally {
      setBusy(false);
    }
  }

  const quick = [
    "What should we focus on right now?",
    "How do we structure our API calls cleanly?",
    "Our demo is in 3 days — what matters most?",
    "Explain error handling for external APIs",
  ];

  return (
    <Card glow="brand" className={`flex flex-col p-5 ${compact ? "h-[560px]" : "h-[640px]"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-lg text-white shadow-[0_8px_20px_-6px_rgba(71,79,224,0.6)]">
            🤖
            <span className="pulse-dot absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-ink-900">Prototype Coach</h3>
            <p className="text-[11px] text-ink-400">
              {milestone ? `${teamName} · milestone: ${milestone.title}` : teamName}
            </p>
          </div>
        </div>
        {engine ? <Badge tone="violet">engine: {engine}</Badge> : <Badge tone="gray">heuristic mode</Badge>}
      </div>

      {/* Current milestone context strip */}
      {milestone ? (
        <div className="mt-3 rounded-xl bg-gradient-to-r from-brand-50/80 to-violet-50/50 px-3.5 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">Now focusing on</p>
          <p className="mt-0.5 text-sm font-semibold text-ink-800">{milestone.title}</p>
          {checklist.length ? (
            <p className="mt-1 text-[11px] text-ink-500">
              {checklist.filter((c) => c.done).length}/{checklist.length} checklist tasks done
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="scroll-thin mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="space-y-2.5">
            <div className="rounded-xl bg-brand-50/70 p-4 text-sm text-brand-900">
              <p className="font-semibold">Hi! I'm your prototype coach. 👋</p>
              <p className="mt-1 text-[13px]">Ask me anything about your current milestone — I can see your checklist state, artefacts, and the APIs registered in your API Lab.</p>
            </div>
            {insights.length ? (
              <ul className="space-y-1.5 rounded-xl bg-violet-50/60 px-3.5 py-3 text-xs text-violet-900">
                {insights.map((s, i) => <li key={i}>💡 {s}</li>)}
              </ul>
            ) : null}
          </div>
        ) : null}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md border border-ink-100 bg-white/80 text-ink-700"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-ink-100 bg-white/80 px-4 py-3">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-400" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-400" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-400" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {quick.map((q) => (
          <button key={q} onClick={() => ask(q)} disabled={busy} className="rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-left text-[11px] font-medium leading-snug text-ink-600 transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm disabled:opacity-50">
            {q}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          className="flex-1 rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          aria-label="Ask the coach"
        />
        <Button type="submit" disabled={busy || !input.trim()}>Send</Button>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Milestones — vertical rail with connector line
// ---------------------------------------------------------------------------

function MilestonesPanel({ team, milestones, isMember }: { team: TeamDto; milestones: MilestoneDto[]; isMember: boolean }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateMilestone(id: string, patch: Record<string, unknown>) {
    setBusyId(id);
    await fetch(`/api/milestones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusyId(null);
    router.refresh();
  }

  if (!milestones.length) {
    return <EmptyState title="No milestones" sub="Generate a prototype track from the challenge page first." />;
  }

  return (
    <div className="relative space-y-4 pl-6">
      {/* Vertical rail */}
      <div className="rail-line absolute bottom-6 left-[15px] top-6 w-0.5 rounded-full" aria-hidden />
      {milestones.map((m, idx) => {
        const checklist = parseJson<ChecklistItem[]>(m.checklistItems, []);
        const suggestions = parseJson<unknown[]>(m.aiSuggestions, []);
        const labelOf = (s: unknown) => (typeof s === "string" ? s : typeof s === "object" && s !== null && "detail" in s ? String((s as { detail: unknown }).detail) : "");
        const resources = suggestions.map(labelOf).filter((s) => s.includes("http"));
        const insights = suggestions.map(labelOf).filter((s) => s && !s.includes("http"));
        const doneCount = checklist.filter((c) => c.done).length;
        const isDone = m.status === "done";
        const isWip = m.status === "in_progress";
        return (
          <div key={m.id} className="relative">
            {/* Rail node */}
            <span
              className={`absolute -left-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white ${
                isDone
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_6px_16px_-4px_rgba(16,185,129,0.6)]"
                  : isWip
                    ? "bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[0_6px_16px_-4px_rgba(71,79,224,0.65)] pulse-dot"
                    : "bg-white text-ink-400 ring-1 ring-ink-200 ring-4"
              }`}
            >
              {isDone ? "✓" : idx + 1}
            </span>
            <Card hover glow={isWip ? "brand" : undefined} className={`p-5 ${isDone ? "opacity-90" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-ink-900">{m.title}</h3>
                  <StatusBadge status={m.status} />
                  {m.dueDate ? <span className="text-xs text-ink-400">due {formatDate(m.dueDate)}</span> : null}
                  {checklist.length ? <span className="text-xs text-ink-400">{doneCount}/{checklist.length} tasks</span> : null}
                </div>
                <p className="mt-1.5 text-sm text-ink-500">{m.description}</p>

                {checklist.length ? (
                  <ul className="mt-3 space-y-1.5">
                    {checklist.map((c, i) => (
                      <li key={i}>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
                          <input
                            type="checkbox"
                            checked={c.done}
                            disabled={!isMember || busyId === m.id}
                            onChange={() => updateMilestone(m.id, { toggleChecklistIndex: i })}
                            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
                          />
                          <span className={c.done ? "text-ink-400 line-through" : ""}>{c.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {resources.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {resources.map((r) => {
                      const [label, url] = r.split(/:\s?(?=https?:\/\/)/);
                      return (
                        <a key={r} href={url ?? r} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 transition hover:-translate-y-0.5 hover:bg-ink-100 hover:shadow-sm">
                          📎 {label}
                        </a>
                      );
                    })}
                  </div>
                ) : null}
                {insights.length ? (
                  <ul className="mt-3 space-y-1 rounded-xl bg-gradient-to-r from-brand-50/80 to-violet-50/40 px-3.5 py-2.5 text-xs text-brand-900">
                    {insights.map((s, i) => <li key={i}>🤖 {s}</li>)}
                  </ul>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <select
                    value={m.status}
                    disabled={!isMember || busyId === m.id}
                    onChange={(e) => updateMilestone(m.id, { status: e.target.value })}
                    className="w-40 rounded-xl border border-ink-200 bg-white/80 px-3 py-2 text-sm text-ink-800 focus:border-brand-400 focus:outline-none"
                    aria-label={`Status for ${m.title}`}
                  >
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                  <NotesPopover milestoneId={m.id} initial={m.notes} canEdit={isMember} />
                </div>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

function NotesPopover({ milestoneId, initial, canEdit }: { milestoneId: string; initial: string; canEdit: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch(`/api/milestones/${milestoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: value }),
    });
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  return open ? (
    <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-1">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a note…"
        disabled={!canEdit}
        className="w-full rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-auto sm:flex-1"
      />
      <Button variant="primary" className="px-3 py-1.5 text-xs" onClick={save} disabled={busy}>Save</Button>
      <Button variant="ghost" className="px-2 py-1.5 text-xs" onClick={() => setOpen(false)}>✕</Button>
    </div>
  ) : (
    <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => setOpen(true)}>
      {initial ? "📝 Edit note" : "📝 Add note"}
    </Button>
  );
}

function TeamNotes({ teamId, initial, canEdit }: { teamId: string; initial: string; canEdit: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch(`/api/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: value }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <textarea
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!canEdit}
        placeholder="Shared team notes…"
        className="w-full rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      <Button variant="outline" className="w-full px-3 py-1.5 text-xs" onClick={save} disabled={busy || !canEdit}>{busy ? "Saving…" : "Save notes"}</Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Command Center — the 3-column hero view: milestone rail / coach / live stack
// ---------------------------------------------------------------------------

function CommandCenter({
  team,
  milestones,
  active,
  isMember,
  selectedMilestoneId,
  onSelectMilestone,
  onNavigate,
}: {
  team: TeamDto;
  milestones: MilestoneDto[];
  active?: MilestoneDto;
  isMember: boolean;
  selectedMilestoneId: string | null;
  onSelectMilestone: (id: string | null) => void;
  onNavigate: (tab: Tab) => void;
}) {
  const current = milestones.find((m) => m.id === selectedMilestoneId) ?? active ?? milestones[0];
  const checklist = current ? parseJson<ChecklistItem[]>(current.checklistItems, []) : [];
  const suggestions = current ? parseJson<unknown[]>(current.aiSuggestions, []) : [];
  const insights = suggestions
    .map((s) => (typeof s === "string" ? s : typeof s === "object" && s !== null && "detail" in s ? String((s as { detail: unknown }).detail) : ""))
    .filter((s) => s && !s.includes("http"));
  const allCases = team.externalApis.flatMap((a) => a.testCases);
  const failing = allCases.filter((t) => t.consecutiveFailures >= 2).length;
  const passing = allCases.filter((t) => t.lastStatus !== null && t.consecutiveFailures === 0).length;

  return (
    <div className="grid gap-5 xl:grid-cols-[290px_1fr_300px]">
      {/* ------------------- Column 1: milestone rail + quick stats -------- */}
      <div className="fade-up space-y-5">
        <div className="glass-deep scroll-thin max-h-[560px] space-y-2 overflow-y-auto rounded-2xl p-3">
          <div className="flex items-center justify-between px-1 pb-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">Milestone rail</p>
            <span className="text-[11px] font-semibold text-ink-400">{milestones.filter((m) => m.status === "done").length}/{milestones.length}</span>
          </div>
          {milestones.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-ink-400">No track yet — generate one from the challenge page.</p>
          ) : null}
          {milestones.map((m, i) => {
            const selected = current?.id === m.id;
            const isDone = m.status === "done";
            const isWip = m.status === "in_progress";
            return (
              <button
                key={m.id}
                onClick={() => onSelectMilestone(selectedMilestoneId === m.id ? null : m.id)}
                className={`group w-full rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                  selected ? "bg-brand-600 text-white shadow-[0_10px_24px_-10px_rgba(71,79,224,0.7)]" : "text-ink-600 hover:translate-x-1 hover:bg-white/80"}
                `}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isDone ? "bg-emerald-100 text-emerald-700" : isWip ? "bg-amber-100 text-amber-700 pulse-dot" : selected ? "bg-white/25 text-white" : "bg-ink-100 text-ink-500"}
                    `}
                  >
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span className={`min-w-0 truncate text-xs font-semibold ${selected ? "text-white" : "text-ink-800"}`}>{m.title}</span>
                </div>
                {isWip && !selected ? <span className="mt-1 block pl-7 text-[10px] font-semibold text-amber-600">● in progress</span> : null}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onNavigate("Milestones")}
          className="glass card-3d w-full rounded-2xl p-4 text-left transition hover:-translate-y-0.5"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">Full roadmap</p>
          <p className="mt-1 text-sm font-semibold text-brand-700">Open milestone board →</p>
          <p className="mt-0.5 text-xs text-ink-400">Checklists, notes & status controls</p>
        </button>
      </div>

      {/* ------------------- Column 2: coach chat (center stage) ----------- */}
      <div className="fade-up">
        <CoachChat
          teamId={team.id}
          teamName={team.name}
          milestone={current}
          checklist={checklist}
          insights={insights}
          compact
        />
      </div>

      {/* ------------------- Column 3: live stack -------------------------- */}
      <div className="fade-up space-y-5">
        <Card hover className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-800">Artefacts</h3>
            <span className="font-display text-2xl font-bold text-brand-600">{team.artefacts.length}</span>
          </div>
          {team.artefacts.slice(0, 3).map((a) => (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="mt-2 block truncate text-xs text-brand-700 hover:underline">
              📎 {a.shortDescription || a.url}
            </a>
          ))}
          {team.artefacts.length === 0 ? <p className="mt-2 text-xs text-ink-400">Nothing uploaded yet.</p> : null}
          <button onClick={() => onNavigate("Artefacts")} className="mt-2 text-xs font-semibold text-ink-500 hover:text-brand-600">Manage all →</button>
        </Card>
        <Card hover glow={failing ? "brand" : undefined} className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-800">API Lab</h3>
            <Badge tone={failing ? "red" : passing ? "green" : "gray"}>{failing ? `${failing} failing` : passing ? "healthy" : "untested"}</Badge>
          </div>
          <p className="mt-2 text-xs text-ink-500">
            {team.externalApis.length} registered API{team.externalApis.length === 1 ? "" : "s"} · {allCases.length} test case{allCases.length === 1 ? "" : "s"}
          </p>
          <button onClick={() => onNavigate("API Lab")} className="mt-2 text-xs font-semibold text-ink-500 hover:text-brand-600">Open API Lab →</button>
        </Card>
        <ActivityStream teamId={team.id} limit={6} compact />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Artefacts
// ---------------------------------------------------------------------------

function ArtefactsPanel({ team, milestones, isMember }: { team: TeamDto; milestones: MilestoneDto[]; isMember: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [type, setType] = useState("doc");
  const [desc, setDesc] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    await fetch("/api/artefacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: team.id, milestoneId: milestoneId || undefined, type, url, shortDescription: desc }),
    });
    setUrl("");
    setDesc("");
    setBusy(false);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/artefacts?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  const TYPE_ICONS: Record<string, string> = { doc: "📄", code_repo: "🐙", demo_video: "🎬", slide: "📊", other: "📎" };

  return (
    <div className="space-y-4">
      {isMember ? (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-ink-800">Add artefact</h3>
          <form onSubmit={add} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/team/repo or doc link" aria-label="Artefact URL" className="w-full rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
            <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Artefact type" className="w-full rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm focus:border-brand-400 focus:outline-none">
              <option value="doc">Document</option>
              <option value="code_repo">Code repo</option>
              <option value="demo_video">Demo video</option>
              <option value="slide">Slide deck</option>
              <option value="other">Other</option>
            </select>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description" aria-label="Description" className="w-full rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
            <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} aria-label="Attach to milestone" className="w-full rounded-xl border border-ink-200 bg-white/80 px-3.5 py-2 text-sm focus:border-brand-400 focus:outline-none">
              <option value="">No specific milestone</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>{m.orderIndex + 1}. {m.title}</option>
              ))}
            </select>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy}>{busy ? "Adding…" : "＋ Add artefact"}</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {team.artefacts.length === 0 ? (
        <EmptyState title="No artefacts yet" sub="Upload repo links, demo videos, docs, and slides as you build." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {team.artefacts.map((a) => (
            <Card key={a.id} hover className="p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xl" aria-hidden>{TYPE_ICONS[a.type] ?? "📎"}</span>
                {isMember ? (
                  <button onClick={() => remove(a.id)} className="text-xs text-ink-300 hover:text-red-500" aria-label="Delete artefact">✕</button>
                ) : null}
              </div>
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="mt-2 block truncate text-sm font-semibold text-brand-700 hover:underline">
                {a.shortDescription || a.url}
              </a>
              <p className="mt-1 text-xs text-ink-400">
                {a.type.replace("_", " ")} · {a.milestone?.title ? `${a.milestone.title} · ` : ""}by {a.uploader.name} · {relativeTime(a.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
