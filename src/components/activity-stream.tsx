"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/utils";

interface Event {
  id: string;
  actorName: string;
  action: string;
  summary: string;
  createdAt: string;
}

const ACTION_ICONS: Record<string, string> = {
  "challenge.create": "🏁",
  "challenge.update": "✏️",
  "team.create": "👥",
  "team.member_join": "🙋",
  "milestone.update": "📍",
  "artefact.upload": "📦",
  "agent.action": "🤖",
  "api.register": "🔌",
  "api.test": "🧪",
  "feedback.create": "📝",
  "feedback.finalise": "✅",
  "asset.publish": "🎓",
  "registry.review": "🛡️",
  "coach.question": "💬",
  "provider.add": "🔑",
};

export function ActivityStream({ teamId, challengeId, limit = 12, compact }: { teamId?: string; challengeId?: string; limit?: number; compact?: boolean }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const params = new URLSearchParams();
      if (teamId) params.set("teamId", teamId);
      if (challengeId) params.set("challengeId", challengeId);
      params.set("limit", String(limit));
      try {
        const res = await fetch(`/api/activity?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (alive) {
          setEvents(data.events ?? []);
          setLoading(false);
        }
      } catch {
        if (alive) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [teamId, challengeId, limit]);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-emerald-500" />
        <h3 className="text-sm font-bold text-ink-800">Activity Stream</h3>
        <span className="ml-auto text-[11px] text-ink-400">live</span>
      </div>
      {loading ? (
        <p className="py-4 text-center text-xs text-ink-400">Loading activity…</p>
      ) : events.length === 0 ? (
        <p className="py-4 text-center text-xs text-ink-400">No activity yet — updates appear here in real time.</p>
      ) : (
        <ul className={`scroll-thin space-y-2.5 overflow-y-auto pr-1 ${compact ? "max-h-56" : "max-h-80"}`}>
          {events.map((e) => (
            <li key={e.id} className="flex gap-2.5 text-xs">
              <span className="mt-0.5 shrink-0 text-sm" aria-hidden>
                {ACTION_ICONS[e.action] ?? "•"}
              </span>
              <div className="w-0 min-w-0 flex-1">
                <p className="truncate text-ink-700" title={e.summary}>{e.summary}</p>
                <p className="text-[11px] text-ink-400">
                  {e.actorName} · {relativeTime(e.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
