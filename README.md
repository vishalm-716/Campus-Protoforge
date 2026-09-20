# Campus ProtoForge — Challenge-to-Prototype Studio

> Turn campus ideas into working prototypes, with agentic AI as your studio coach.

Campus ProtoForge is a multi-role, agentic-AI platform for college innovation ecosystems. Students and faculty submit challenges or raw ideas; AI agents structure them into standardized briefs, generate personalized prototype tracks, coach teams at every milestone, draft faculty feedback, and produce pitch documentation — all review-first, with human override everywhere. Teams build with **their own APIs and keys**, test them in a built-in API Lab, and publish to a campus-wide API Registry. Faculty graduate finished prototypes into a reusable Learning Assets Library.

## ✨ Feature map

| Area | What you get |
| --- | --- |
| **Roles & auth** | Student / Faculty / Admin with role-scoped dashboards, HttpOnly session cookies, scrypt password hashing |
| **Challenges** | Submit raw ideas, AI-structured briefs (problem, context, constraints, learners, metrics), filters, public/private visibility |
| **Prototype tracks** | 5-phase agent-generated roadmaps (Discover → Plan → MVP → Refine → Demo) with checklists, resources, due dates |
| **Team workspace** | Milestone board, status + checklist toggles, notes, artefact links, shared notes, live activity stream |
| **API Lab** | Register team APIs, server-side request tester, save passing runs as test cases, attach cases to milestones |
| **Campus API Registry** | Student APIs published campus-wide with faculty/admin approval, categories, tags, usage metrics |
| **BYOK AI Providers** | Per-team keys for OpenAI / Groq / Mistral / Gemini / xAI — AES-256-GCM encrypted at rest, agent-scoped overrides |
| **Feedback** | AI rubric drafts flagged "needs human review", faculty edit + finalise (agents never auto-grade) |
| **Docs & Pitch** | README outline (with *your* API snippets), one-page summary, 2–3 min pitch script |
| **Risk Radar** | Retention agent flags inactive/overdue teams with suggested nudges |
| **Admin** | Agent config (autonomy, prompts), analytics (challenges, teams, completion, engagement, agent runs) |
| **Observability** | Live Activity Stream on challenge & team pages, Integration Health widget, SVG architecture diagram |

## 🤖 The six agents

All agents run **with zero configuration** using deterministic heuristic engines. Add a key (env or per-team BYOK) and the same agents switch to live LLM reasoning via one unified client. Every agent run is recorded in `AgentLog` and surfaced in the activity stream.

| Agent | Endpoint | What it does | Safety policy |
| --- | --- | --- | --- |
| **Idea Structurer** | `POST /api/agents/structure-challenge` | Raw idea → standardized brief (problem, context, constraints, learners, metrics, evaluation hints) | Output is a draft; owner/faculty approve or edit |
| **Track Generator** | `POST /api/agents/generate-track` | Challenge + student skills → 5-phase track with milestones, checklists, resources | Human can override level and edit milestones |
| **Prototype Coach** | `POST /api/agents/prototype-coach` | Milestone-aware guidance; references the team's registered APIs for integration ideas | Suggestions only; writes `ai_suggestions`, never changes status |
| **Feedback Agent** | `POST /api/agents/feedback-draft` | Rubric-score + comment drafts with explicit `needsHumanReview` flags | **Never finalises** — faculty must confirm; saved with `finalised: false` |
| **Docs & Pitch** | `POST /api/agents/pitch-docs` | README outline (incl. student-API snippets), one-page summary, pitch script | Attached to team; team edits before use |
| **Retention Radar** | `GET /api/agents/retention-summary` | Detects at-risk teams (inactivity, overdue milestones, solo teams) and drafts nudges | Advisory only; surfaced on faculty/admin dashboards |

### BYOK LLM architecture

```
agent module ──► llmComplete(agent, messages, { teamId })
                    │
                    ├─ 1. team LlmProvider (agent-scoped → team-wide)  ← BYOK, AES-GCM at rest
                    ├─ 2. platform env key (OPENAI_API_KEY, GROQ_API_KEY, …)
                    └─ 3. fallback → deterministic heuristic engine (works offline)
```

`POST /api/llm` exposes the same unified client for custom workflows. Providers live in `src/lib/llm/providers.ts` — OpenAI-compatible adapters cover OpenAI, Groq, Mistral, and xAI; Gemini uses its `generateContent` API. Adding a provider is one adapter entry.

## 🚀 Quick start

```bash
npm install
npx prisma db push        # create SQLite database (prisma/dev.db)
npx tsx prisma/seed.ts    # seed demo data
npm run dev               # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

### Demo logins (password: `demo123`)

| Email | Role | What to try |
| --- | --- | --- |
| `student@campus.edu` | Student (Rahul) | Open **My Teams → Dry Runners**: tick checklists, ask the Coach, test APIs in the API Lab |
| `faculty@campus.edu` | Faculty (Dr. Arjun Mehta) | Risk Radar, feedback drafts (request → edit → finalise), registry approvals, graduate a learning asset |
| `admin@campus.edu` | Admin (Priya Raman) | Analytics dashboard, agent configuration, registry curation |

## 🔐 Environment variables (`.env`)

```bash
# SQLite for zero-config dev; point at Postgres in production
DATABASE_URL="file:./dev.db"

# --- Optional BYOK LLM keys (leave blank to use heuristic engines) ---
OPENAI_API_KEY=""
GROQ_API_KEY=""
MISTRAL_API_KEY=""
GOOGLE_GENERATIVE_AI_API_KEY=""
XAI_API_KEY=""

# Optional per-agent model overrides (e.g. "gpt-4o", "llama-3.3-70b-versatile")
LLM_DEFAULT_AGENT_MODEL=""
LLM_STRUCTURE_MODEL=""
LLM_TRACK_MODEL=""
LLM_COACH_MODEL=""
LLM_FEEDBACK_MODEL=""
LLM_DOCS_MODEL=""

# Encrypts team API keys at rest — set a strong random value in production
APP_ENCRYPTION_KEY="change-me-in-production"
```

**Postgres:** change `DATABASE_URL` and set `provider = "postgresql"` in `prisma/schema.prisma`, then `npx prisma db push`.

## 📁 Project structure

```
prisma/schema.prisma        # 18 models — users, challenges, tracks, teams, APIs, agents
prisma/seed.ts              # demo campus: users, 4 challenges, teams, APIs, feedback, assets
src/lib/
  llm/                      # BYOK client, provider adapters, JSON extraction
  agents/                   # 6 agent modules (LLM + heuristic fallback)
  db.ts auth.ts crypto.ts   # Prisma singleton, sessions, scrypt + AES-256-GCM
  permissions.ts activity.ts
src/app/
  page.tsx                  # landing (SEO/AEO/GEO: JSON-LD, FAQs, HowTo)
  challenges/ registry/ library/    # public pages
  signin/ signup/           # role-based auth
  dashboard/                # role-aware: home, challenges, teams, risk, agents, registry, library, profile
  dashboard/teams/[id]/     # workspace: milestones, artefacts, API Lab, coach, docs, feedback, providers, architecture
  api/                      # auth, challenges, teams, milestones, artefacts, feedback,
                            # agents/* (6 agent endpoints), llm, providers, external-apis,
                            # api-lab/test, registry/[id]/review, analytics, agent-configs
src/components/             # UI kit, workspace tabs, charts, activity stream, API Lab, coach
```

## 🧭 The full flow (demo path)

1. **Idea** — sign in as `student@campus.edu`, submit a challenge from *Challenges → Submit*; the Idea Structurer drafts a brief instantly.
2. **Track** — open the challenge, click *Generate Prototype Track*; five phases appear with checklists and resources.
3. **Team** — *Teams → Create team*, pick the challenge + track; the workspace opens.
4. **Build** — tick checklist items, set milestone status, add artefact links, register + test APIs in the **API Lab** (saved cases feed the Integration Health widget and Architecture view).
5. **Coach** — ask the Prototype Coach for guidance; it reads your milestone, artefacts, and registered APIs.
6. **Review** — as faculty, open the team → *Feedback → Request AI draft* → adjust sliders → *Finalise*. Flags show where evidence was thin.
7. **Graduate** — faculty *Library → Graduate* promotes the prototype to the public Learning Assets Library.

## 📐 Design principles

- **Review-first agents** — every AI output lands as a draft a human approves. The Feedback Agent structurally cannot finalise grades.
- **Works offline** — heuristic engines make the full product usable with no keys, no network.
- **BYOK everywhere** — teams own their keys and model choices, scoped per agent.
- **Your APIs, first-class** — the API Lab, Registry, architecture diagram, and coach integration ideas all revolve around the APIs students actually build.

## 🛠 Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 (light glassmorphism UI) · Prisma + SQLite (Postgres-ready) · Recharts · scrypt sessions · zero-dependency LLM adapters.
