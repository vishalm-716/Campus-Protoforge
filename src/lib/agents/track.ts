import { prisma } from "../db";
import { llmComplete } from "../llm/client";
import { extractJson } from "../llm/json";
import { logAgent } from "../activity";
import type { TrackSpec } from "../types";

const PHASES = [
  { phase: "Discover & clarify", title: "Discover & Clarify the Problem", focus: "problem framing, user research, success criteria" },
  { phase: "Plan architecture", title: "Plan the Architecture", focus: "system design, API choices, data model" },
  { phase: "Build first MVP", title: "Build the First MVP", focus: "core flow end-to-end with real APIs" },
  { phase: "Refine & test", title: "Refine & Test", focus: "error handling, polish, validation with users" },
  { phase: "Demo & documentation", title: "Demo & Documentation", focus: "pitch, README, demo video, handover" },
] as const;

const SYSTEM = `You are the Curriculum & Skill Mapper Agent for Campus ProtoForge.
Given a challenge and student profile, produce a prototype track. Reply with ONLY JSON:
{ "level": "beginner"|"intermediate"|"advanced", "skillTags": string[], "syllabusLinks": [{"label","url"}],
  "milestones": [ { "phase": string, "title": string, "description": string, "checklist": string[], "resources": [{"label","url"}] } ] }
Exactly 5 milestones following phases: Discover & clarify, Plan architecture, Build first MVP, Refine & test, Demo & documentation.
Resources should be real, generic, reputable learning URLs where possible.`;

function heuristicTrack(challengeTitle: string, description: string, tags: string[], skills: string[], difficulty: string): TrackSpec {
  const skillPool = Array.from(new Set([...tags, ...skills])).slice(0, 8);
  const lower = (challengeTitle + " " + description).toLowerCase();
  const level: TrackSpec["level"] =
    difficulty === "beginner" || (!difficulty && lower.includes("starter"))
      ? "beginner"
      : difficulty === "advanced"
        ? "advanced"
        : "intermediate";

  const milestoneContent: Record<string, { checklist: string[]; resources: { label: string; url: string }[] }> = {
    "Discover & clarify": {
      checklist: [
        "Write a one-paragraph problem statement in your own words",
        "Identify 3 potential users and interview them briefly",
        "List the top 5 user needs / pain points",
        "Define success criteria for the MVP",
      ],
      resources: [
        { label: "Google Design Sprint basics", url: "https://designsprintkit.withgoogle.com/" },
        { label: "How to write a problem statement", url: "https://www.atlassian.com/team-playbook/plays/problem-framing" },
      ],
    },
    "Plan architecture": {
      checklist: [
        "Sketch the system diagram (frontend, backend, APIs)",
        "Pick your stack and list every external API you will call",
        "Register each external API in the team API Lab",
        "Define the data model for your prototype",
        "Write a build plan split across team members",
      ],
      resources: [
        { label: "The Twelve-Factor App", url: "https://12factor.net/" },
        { label: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
      ],
    },
    "Build first MVP": {
      checklist: [
        "Set up the repo and a minimal running skeleton",
        "Implement the single most important user flow end-to-end",
        "Wire in your first external API call with error handling",
        "Deploy or run locally for a live demo",
      ],
      resources: [
        { label: "MDN Web Docs", url: "https://developer.mozilla.org/" },
        { label: "Postman API docs", url: "https://learning.postman.com/docs/intro-overview/" },
      ],
    },
    "Refine & test": {
      checklist: [
        "Handle the 5 most likely failure cases (network, auth, empty data)",
        "Run one usability session with a classmate",
        "Fix the top 3 issues found",
        "Add basic tests for the core flow",
      ],
      resources: [
        { label: "Web.dev testing", url: "https://web.dev/learn/testing/" },
        { label: "Intro to usability testing", url: "https://www.nngroup.com/articles/usability-testing-101/" },
      ],
    },
    "Demo & documentation": {
      checklist: [
        "Record a 2–3 minute demo video",
        "Write the README with setup instructions",
        "Run the Docs & Pitch agent and edit its output",
        "Prepare a 5-slide summary of impact",
      ],
      resources: [
        { label: "Make a README", url: "https://www.makeareadme.com/" },
        { label: "Talk like TED: pitch structure", url: "https://www.toastmasters.org/resources/public-speaking-tips" },
      ],
    },
  };

  return {
    level,
    skillTags: skillPool,
    syllabusLinks: [],
    milestones: PHASES.map((p, i) => ({
      phase: p.phase,
      title: p.title,
      description: `Phase ${i + 1} — ${p.focus}. For "${challengeTitle}", focus on ${p.focus} to move the prototype forward.`,
      checklist: milestoneContent[p.phase].checklist,
      resources: milestoneContent[p.phase].resources,
    })),
  };
}

export interface GenerateTrackInput {
  challengeId: string;
  studentUserId?: string;
  overrides?: { level?: TrackSpec["level"] };
}

export async function runTrackAgent(input: GenerateTrackInput, actorId?: string | null) {
  const challenge = await prisma.challenge.findUniqueOrThrow({
    where: { id: input.challengeId },
    include: { tracks: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const student = input.studentUserId
    ? await prisma.user.findUnique({ where: { id: input.studentUserId } })
    : null;

  const tags = JSON.parse(challenge.domainTags || "[]") as string[];
  const skills = student ? (JSON.parse(student.skills || "[]") as string[]) : [];
  const courses = student?.preferredStack ?? "";

  const { result, config } = await llmComplete(
    "track",
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Challenge: ${challenge.title}\nBrief: ${challenge.structuredBrief ?? challenge.rawDescription}\nDifficulty: ${challenge.difficulty}\nTags: ${tags.join(", ")}\nStudent skills: ${skills.join(", ") || "unknown"}\nPreferred stack / courses: ${courses || "unknown"}`,
      },
    ],
  );

  let spec: TrackSpec | null = result ? extractJson<TrackSpec>(result.text) : null;
  const usedLlm = Boolean(spec?.milestones?.length);
  if (!spec || !spec.milestones?.length) {
    spec = heuristicTrack(challenge.title, challenge.rawDescription, tags, skills, challenge.difficulty);
  }
  if (input.overrides?.level) spec.level = input.overrides.level;

  const dueBase = new Date();
  const track = await prisma.prototypeTrack.create({
    data: {
      challengeId: challenge.id,
      level: spec.level,
      syllabusLinks: JSON.stringify(spec.syllabusLinks ?? []),
      skillTags: JSON.stringify(spec.skillTags ?? []),
      createdByAgent: true,
      milestones: {
        create: spec.milestones.slice(0, 5).map((m, i) => ({
          orderIndex: i,
          title: m.title || PHASES[i].phase,
          description: m.description || "",
          checklistItems: JSON.stringify((m.checklist ?? []).map((label) => ({ label, done: false }))),
          aiSuggestions: JSON.stringify((m.resources ?? []).map((r) => `${r.label}: ${r.url}`)),
          dueDate: new Date(dueBase.getTime() + (i + 1) * 14 * 24 * 3600 * 1000),
        })),
      },
    },
    include: { milestones: { orderBy: { orderIndex: "asc" } } },
  });

  await logAgent({
    agentName: "Track Generator",
    actionType: usedLlm ? "track_generated" : "track_generated_heuristic",
    relatedEntityType: "challenge",
    relatedEntityId: challenge.id,
    actorId,
    payload: { trackId: track.id, engine: result ? `${config.provider}/${config.model}` : "heuristic", level: track.level },
  });

  return { track, engine: result ? `${config.provider}/${config.model}` : "heuristic" };
}
