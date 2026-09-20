"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Badge, Textarea, EmptyState } from "./ui";
import { parseJson, relativeTime } from "@/lib/utils";
import type { AiDraft, RubricCriterion } from "@/lib/types";
import { RUBRIC_TEMPLATE } from "@/lib/constants";

interface FeedbackDto {
  id: string;
  finalised: boolean;
  comments: string;
  rubricScores: string;
  aiDraft: string | null;
  createdAt: string;
  faculty: { name: string };
  milestone: { title: string } | null;
}

export function FeedbackPanel({ team, user, canReview }: { team: { id: string; name: string }; user: { id: string; role: string }; canReview: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scores, setScores] = useState<RubricCriterion[]>([]);
  const [comments, setComments] = useState("");
  const [notice, setNotice] = useState("");

  async function requestDraft() {
    setBusy(true);
    setNotice("");
    const res = await fetch("/api/agents/feedback-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: team.id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setNotice(`Draft created via ${data.engine} — review and adjust before finalising.`);
    else setNotice(data.error ?? "Failed to create draft");
    router.refresh();
  }

  function startEditing(f: FeedbackDto) {
    const rubric = parseJson<RubricCriterion[]>(f.rubricScores, []);
    const draft = parseJson<AiDraft | null>(f.aiDraft, null);
    const templateScores: RubricCriterion[] = RUBRIC_TEMPLATE.map((t) => ({ name: t.name, maxScore: t.maxScore, score: null }));
    const source = rubric.length ? rubric : templateScores;
    const base: RubricCriterion[] = source.map((s) => ({
      name: s.name,
      maxScore: s.maxScore ?? RUBRIC_TEMPLATE.find((t) => t.name === s.name)?.maxScore ?? 10,
      score: s.score,
    }));
    setScores(base);
    setComments(f.comments || (draft?.commentSuggestions ?? []).join("\n"));
    setEditingId(f.id);
  }

  async function saveFinalise(f: FeedbackDto, finalise: boolean) {
    setBusy(true);
    await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: f.id, rubricScores: scores, comments, finalised: finalise }),
    });
    setBusy(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canReview ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h3 className="font-display text-lg font-bold text-ink-900">📝 Feedback & rubric</h3>
            <p className="mt-0.5 text-xs text-ink-400">The Feedback Agent drafts scores — you edit and finalise. Nothing is ever auto-graded.</p>
          </div>
          <Button onClick={requestDraft} disabled={busy}>{busy ? "Drafting…" : "🤖 Request AI draft"}</Button>
        </Card>
      ) : null}
      {notice ? <p className="rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-brand-800">{notice}</p> : null}

      <FeedbackList team={team} user={user} canReview={canReview} editingId={editingId} setEditingId={setEditingId} startEditing={startEditing} scores={scores} setScores={setScores} comments={comments} setComments={setComments} saveFinalise={saveFinalise} busy={busy} />
    </div>
  );
}

function FeedbackList({ team, user, canReview, editingId, setEditingId, startEditing, scores, setScores, comments, setComments, saveFinalise, busy }: {
  team: { id: string; name: string };
  user: { id: string; role: string };
  canReview: boolean;
  editingId: string | null;
  setEditingId: (v: string | null) => void;
  startEditing: (f: FeedbackDto) => void;
  scores: RubricCriterion[];
  setScores: (s: RubricCriterion[]) => void;
  comments: string;
  setComments: (c: string) => void;
  saveFinalise: (f: FeedbackDto, finalise: boolean) => Promise<void>;
  busy: boolean;
}) {
  // The list is rendered by the parent using router.refresh data; we read from a server prop instead.
  return <FeedbackListServerBridge teamId={team.id} canReview={canReview} editingId={editingId} setEditingId={setEditingId} startEditing={startEditing} scores={scores} setScores={setScores} comments={comments} setComments={setComments} saveFinalise={saveFinalise} busy={busy} />;
}

function FeedbackListServerBridge(props: {
  teamId: string;
  canReview: boolean;
  editingId: string | null;
  setEditingId: (v: string | null) => void;
  startEditing: (f: FeedbackDto) => void;
  scores: RubricCriterion[];
  setScores: (s: RubricCriterion[]) => void;
  comments: string;
  setComments: (c: string) => void;
  saveFinalise: (f: FeedbackDto, finalise: boolean) => Promise<void>;
  busy: boolean;
}) {
  const { feedbacks } = useFeedbacks(props.teamId);
  if (!feedbacks.length) {
    return (
      <EmptyState
        title="No feedback yet"
        sub={props.canReview ? "Request an AI draft above — the agent reads milestones and artefacts and drafts rubric scores for your review." : "Faculty feedback will appear here once your mentor reviews the team's work."}
      />
    );
  }
  return (
    <div className="space-y-4">
      {feedbacks.map((f) => <FeedbackCard key={f.id} f={f} canReview={props.canReview} editingId={props.editingId} setEditingId={props.setEditingId} startEditing={props.startEditing} scores={props.scores} setScores={props.setScores} comments={props.comments} setComments={props.setComments} saveFinalise={props.saveFinalise} busy={props.busy} />)}
    </div>
  );
}

// Tiny client-side fetch bridge so the panel refreshes after actions.
import { useEffect } from "react";
import type { ReactElement } from "react";

function useFeedbacks(teamId: string): { feedbacks: FeedbackDto[] } {
  const [feedbacks, setFeedbacks] = useState<FeedbackDto[]>([]);
  const load = () => {
    fetch(`/api/feedback?teamId=${teamId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { feedbacks: [] }))
      .then((d) => setFeedbacks(d.feedbacks ?? []))
      .catch(() => {});
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [teamId]);
  return { feedbacks };
}

function FeedbackCard({ f, canReview, editingId, setEditingId, startEditing, scores, setScores, comments, setComments, saveFinalise, busy }: {
  f: FeedbackDto;
  canReview: boolean;
  editingId: string | null;
  setEditingId: (v: string | null) => void;
  startEditing: (f: FeedbackDto) => void;
  scores: RubricCriterion[];
  setScores: (s: RubricCriterion[]) => void;
  comments: string;
  setComments: (c: string) => void;
  saveFinalise: (f: FeedbackDto, finalise: boolean) => Promise<void>;
  busy: boolean;
}) {
  const rubric = parseJson<RubricCriterion[]>(f.rubricScores, []);
  const draft = parseJson<AiDraft | null>(f.aiDraft, null);
  const editing = editingId === f.id;
  const total = (editing ? scores : rubric).reduce((sum, s) => sum + (s.score ?? 0), 0);
  const maxTotal = (editing ? scores : rubric).reduce((sum, s) => sum + (s.maxScore ?? 0), 0);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-ink-800">
            {f.milestone?.title ? `${f.milestone.title} — ` : ""}by {f.faculty.name}
          </h4>
          <p className="text-xs text-ink-400">{relativeTime(f.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {maxTotal ? <Badge tone="brand">{total}/{maxTotal}</Badge> : null}
          <Badge tone={f.finalised ? "green" : "amber"}>{f.finalised ? "finalised" : "draft"}</Badge>
        </div>
      </div>

      {/* AI draft insights */}
      {draft ? (
        <div className="mt-3 rounded-xl bg-violet-50/70 px-4 py-3 text-xs text-violet-900">
          <p className="font-semibold">🤖 AI draft insights {draft.confidence ? `(confidence ${(draft.confidence * 100).toFixed(0)}%)` : ""}</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5">
            {(draft.flags ?? []).slice(0, 4).map((fl, i) => <li key={i}>{fl}</li>)}
          </ul>
        </div>
      ) : null}

      {editing ? (
        <div className="mt-4 space-y-3">
          {scores.map((s, i) => (
            <div key={s.name} className="flex items-center gap-3">
              <label className="w-44 shrink-0 text-sm text-ink-700" htmlFor={`score-${f.id}-${i}`}>{s.name} <span className="text-ink-400">/ {s.maxScore}</span></label>
              <input
                id={`score-${f.id}-${i}`}
                type="range"
                min={0}
                max={s.maxScore}
                value={s.score ?? 0}
                onChange={(e) => {
                  const next = [...scores];
                  next[i] = { ...s, score: Number(e.target.value) };
                  setScores(next);
                }}
                className="flex-1 accent-brand-600"
              />
              <span className="w-8 text-right text-sm font-semibold text-ink-800">{s.score ?? 0}</span>
            </div>
          ))}
          <Textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Comments to the team…" />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => saveFinalise(f, false)} disabled={busy}>Save draft</Button>
            <Button variant="primary" onClick={() => saveFinalise(f, true)} disabled={busy}>✅ Finalise feedback</Button>
            <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          {rubric.length ? (
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {rubric.map((s) => (
                <div key={s.name} className="flex items-center justify-between rounded-lg bg-ink-50/70 px-3 py-1.5 text-xs">
                  <span className="text-ink-600">{s.name}</span>
                  <span className="font-semibold text-ink-800">{s.score ?? "—"}/{s.maxScore}</span>
                </div>
              ))}
            </div>
          ) : null}
          {f.comments ? <p className="mt-3 whitespace-pre-wrap text-sm text-ink-600">{f.comments}</p> : null}
          {canReview && !f.finalised ? (
            <Button variant="outline" className="mt-3 px-3 py-1.5 text-xs" onClick={() => startEditing(f)}>✏️ Edit & finalise</Button>
          ) : null}
        </>
      )}
    </Card>
  );
}
