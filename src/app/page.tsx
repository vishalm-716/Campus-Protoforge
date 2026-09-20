import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Card, LinkButton, SectionTitle, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Campus ProtoForge — Turn campus ideas into working prototypes",
  description:
    "Campus ProtoForge is a challenge-to-prototype studio for colleges: students and faculty submit ideas, agentic AI structures them into briefs and guided milestone tracks, teams build with their own APIs, and faculty review with AI-assisted rubrics.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Campus ProtoForge — Challenge-to-Prototype Studio",
    description:
      "Individual students and faculty submit challenges or ideas and turn them into innovative prototypes that break boundaries and shape the future.",
    type: "website",
    siteName: "Campus ProtoForge",
  },
  twitter: { card: "summary_large_image", title: "Campus ProtoForge", description: "Turn campus ideas into working prototypes, with agentic AI as your studio coach." },
};

const FAQS = [
  {
    q: "What is Campus ProtoForge?",
    a: "Campus ProtoForge is a challenge-to-prototype studio for colleges and universities. Students and faculty submit challenges or raw ideas; agentic AI structures them into standardized briefs, generates personalized prototype tracks with milestones, and coaches teams as they build. Faculty review progress with AI-assisted rubrics and graduate the best prototypes into a reusable Learning Assets Library.",
  },
  {
    q: "How does agentic AI support student projects?",
    a: "Six specialized agents work across the lifecycle: the Idea Structurer turns raw descriptions into problem statements and success metrics; the Track Generator creates a five-phase roadmap (Discover, Plan, Build MVP, Refine & Test, Demo & Document) matched to each student's skills; the Prototype Coach answers milestone-level questions; the Feedback Agent drafts rubric scores for faculty review; the Docs & Pitch agent produces README outlines and pitch scripts; and the Retention Radar flags at-risk teams early. AI output is always review-first — faculty confirm all feedback, and students can override any generated plan.",
  },
  {
    q: "How can faculty use this studio for courses and capstones?",
    a: "Faculty publish official course, lab, or capstone challenges, approve AI-structured briefs, monitor every team's milestone progress in one dashboard, request AI rubric drafts that they edit and finalise themselves, and promote successful prototypes into the Learning Assets Library so future cohorts can reuse them. The built-in Risk Radar highlights teams that have gone quiet or are close to missing milestone deadlines.",
  },
  {
    q: "Do I need my own AI API keys?",
    a: "No. The platform ships with deterministic heuristic engines so every agent works out of the box. Teams that want live LLM reasoning can add their own keys (OpenAI, Groq, Mistral, Gemini, xAI) in the team AI Providers page — keys are encrypted at rest and never exposed to the browser. The platform calls all agents through one unified LLM client, so you can switch providers per agent at any time.",
  },
  {
    q: "What is the API Lab and campus API Registry?",
    a: "The API Lab is a built-in playground where each team registers the external or student-built APIs their prototype consumes, tests requests against them, and saves passing requests as reusable test cases attached to milestones. Teams can then submit their APIs to the campus API Registry; faculty or admins approve listings so other departments can discover and reuse them.",
  },
];

const AGENT_CARDS = [
  { icon: "🧩", name: "Idea Structurer", desc: "Turns a rough paragraph into a standardized brief: problem, context, constraints, expected learners, and success metrics.", tint: "bg-brand-50 text-brand-700" },
  { icon: "🗺️", name: "Track Generator", desc: "Builds a five-phase roadmap with checklists and resources, personalized to each student's skills and preferred stack.", tint: "bg-violet-50 text-violet-700" },
  { icon: "🤖", name: "Prototype Coach", desc: "Answers questions at each milestone, suggests next steps, and proposes concrete API integrations from your API Lab.", tint: "bg-emerald-50 text-emerald-700" },
  { icon: "📝", name: "Feedback Agent", desc: "Drafts rubric scores and comments for faculty — always marked as a draft, never auto-finalised.", tint: "bg-amber-50 text-amber-700" },
  { icon: "🎤", name: "Docs & Pitch", desc: "Generates README outlines, one-page summaries, and 2–3 minute pitch scripts, including snippets for your own APIs.", tint: "bg-rose-50 text-rose-700" },
  { icon: "🚨", name: "Retention Radar", desc: "Watches activity patterns to flag at-risk teams and suggest timely nudges to students and faculty.", tint: "bg-ink-100 text-ink-700" },
];

const JOURNEY = [
  { step: "1", title: "Idea", desc: "A student or faculty member submits a challenge with a raw description and domain tags." },
  { step: "2", title: "Structured brief", desc: "The Idea Structurer turns it into a standardized brief; the owner approves or edits it." },
  { step: "3", title: "Prototype track", desc: "The Track Generator maps skills to a five-phase milestone roadmap with checklists and resources." },
  { step: "4", title: "Team workspace", desc: "Teams form, tick off milestones, upload artefacts, test APIs in the API Lab, and chat with the coach." },
  { step: "5", title: "Review & pitch", desc: "Faculty review AI-drafted rubrics, edit, and finalise. The Docs & Pitch agent prepares the story." },
  { step: "6", title: "Learning asset", desc: "Successful prototypes are graduated into the Learning Assets Library for future cohorts." },
];

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Campus ProtoForge — Challenge-to-Prototype Studio",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        description:
          "A campus innovation platform where students and faculty submit challenges, agentic AI structures them into briefs and guided prototype tracks, and teams build prototypes with their own APIs under faculty mentorship.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "EducationalOrganization",
        name: "Campus ProtoForge Partner Universities",
        description: "A network of colleges using structured, AI-assisted challenge-to-prototype workflows for student innovation.",
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "HowTo",
        name: "How a campus idea becomes a prototype in Campus ProtoForge",
        step: JOURNEY.map((j) => ({ "@type": "HowToStep", name: j.title, text: j.desc })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <main id="main">
        {/* -------------------------------------------------------------------
            Hero — minimal 3D entry screen with floating glass panels
        ------------------------------------------------------------------- */}
        <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24" aria-labelledby="hero-heading">
          {/* Aura glows */}
          <div className="hero-aura hero-aura-a -left-24 top-0 h-96 w-96 bg-brand-400/30" aria-hidden />
          <div className="hero-aura hero-aura-b -right-20 top-24 h-80 w-80 bg-accent-400/25" aria-hidden />
          <div className="hero-aura hero-aura-a left-1/3 top-64 h-72 w-72 bg-violet-400/20" aria-hidden />

          <div className="relative grid items-center gap-12 lg:grid-cols-2">
            {/* Left: headline + 3 big CTAs */}
            <div className="fade-up relative z-10">
              <Badge tone="brand" className="mb-6">Agentic AI studio for campus innovation</Badge>
              <h1 id="hero-heading" className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                Turn campus ideas into <span className="hero-gradient-text">working prototypes</span>, with agentic AI as your studio coach.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg">
                Individual students / faculty can submit challenges or ideas and turn them into innovative prototypes that break boundaries and shape the future.
              </p>
              <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
                <LinkButton href="/dashboard/challenges" variant="primary" className="px-7 py-3.5 text-base shadow-[0_14px_36px_-10px_rgba(71,79,224,0.6)]">🎒 Student Workspace</LinkButton>
                <LinkButton href="/signin?role=faculty" variant="accent" className="px-7 py-3.5 text-base shadow-[0_14px_36px_-10px_rgba(233,138,60,0.55)]">🧑‍🏫 Faculty Dashboard</LinkButton>
                <LinkButton href="/registry" variant="outline" className="glass-deep px-7 py-3.5 text-base">🔌 API Registry</LinkButton>
              </div>
              <p className="mt-7 text-xs text-ink-400">
                Works fully offline with built-in heuristic agents · Bring your own LLM keys (OpenAI, Groq, Mistral, Gemini, xAI) anytime
              </p>
            </div>

            {/* Right: floating 3D panel stack */}
            <div className="relative hidden h-[460px] select-none lg:block" aria-hidden>
              {/* Back panel — brief */}
              <div className="float-slower glass-deep absolute left-0 top-6 w-72 rounded-3xl p-5" style={{ "--tilt": "-4deg" } as React.CSSProperties}>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-500">Structured brief</p>
                <p className="mt-2 font-display text-sm font-bold text-ink-800">Campus Energy Dashboard</p>
                <div className="mt-3 space-y-2">
                  <div className="h-1.5 w-full rounded-full bg-ink-100" />
                  <div className="h-1.5 w-5/6 rounded-full bg-ink-100" />
                  <div className="h-1.5 w-3/5 rounded-full bg-brand-100" />
                </div>
                <div className="mt-4 flex gap-1.5">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-semibold text-brand-600">IoT</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">Sustainability</span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-600">Advanced</span>
                </div>
              </div>

              {/* Mid panel — track */}
              <div className="float-slow glass absolute left-40 top-32 w-80 rounded-3xl p-5" style={{ "--tilt": "2deg", zIndex: 2 } as React.CSSProperties}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">Prototype track</p>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">
                    <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" /> live
                  </span>
                </div>
                <div className="mt-3 space-y-2.5">
                  {["Discover & clarify", "Plan architecture", "Build first MVP", "Refine & test", "Demo & docs"].map((s, i) => (
                    <div key={s} className="flex items-center gap-2.5">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${i < 2 ? "bg-emerald-100 text-emerald-600" : i === 2 ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-400"}`}>
                        {i < 2 ? "✓" : i + 1}
                      </span>
                      <span className={`text-xs font-medium ${i <= 2 ? "text-ink-800" : "text-ink-400"}`}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Front panel — coach */}
              <div className="float-fast glass-strong glow-brand absolute left-8 top-72 w-96 rounded-3xl p-5" style={{ zIndex: 3 }}>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-sm text-white">🤖</span>
                  <div>
                    <p className="text-xs font-bold text-ink-800">Prototype Coach</p>
                    <p className="text-[10px] text-ink-400">guiding milestone 3 of 5</p>
                  </div>
                  <span className="ml-auto flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                    <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" /> ACTIVE
                  </span>
                </div>
                <div className="mt-3.5 rounded-2xl bg-brand-50/70 px-3.5 py-3 text-[11px] leading-relaxed text-ink-700">
                  “Your team registered the <b>Campus Energy API</b> in the API Lab. Next: wire the live meter feed into your dashboard and log the first test case.”
                </div>
                <div className="mt-2.5 flex items-center gap-1 pl-1">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-400" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-400" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-400" />
                </div>
              </div>

              {/* Small floating chip — agent status */}
              <div className="float-slow glass absolute -left-4 top-80 rounded-2xl px-4 py-2.5" style={{ zIndex: 4, "--tilt": "-3deg" } as React.CSSProperties}>
                <p className="text-[10px] font-semibold text-ink-500">6 agents on watch</p>
                <p className="shimmer-text font-display text-sm font-bold">All systems nominal</p>
              </div>
            </div>
          </div>

          {/* Hero stats strip */}
          <div className="fade-up-delay-2 relative z-10 mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: "6", v: "specialized AI agents" },
              { k: "5-phase", v: "guided prototype tracks" },
              { k: "BYOK", v: "your keys, your models" },
              { k: "100%", v: "review-first feedback" },
            ].map((s) => (
              <Card key={s.v} hover className="p-4 text-center">
                <p className="font-display text-2xl font-bold text-brand-600">{s.k}</p>
                <p className="mt-1 text-xs text-ink-500">{s.v}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Agents */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="agents-heading">
          <div className="text-center">
            <SectionTitle eyebrow="The studio crew" title="Six agents that carry ideas across the finish line" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" id="agents-heading">
            {AGENT_CARDS.map((a) => (
              <Card key={a.name} hover className="group p-6">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.tint} text-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`} aria-hidden>{a.icon}</span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{a.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{a.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="benefits-heading">
          <SectionTitle eyebrow="Who it serves" title="Built for the whole innovation ecosystem" />
          <div className="grid gap-4 md:grid-cols-3" id="benefits-heading">
            {[
              { icon: "🎒", title: "Students", points: ["Get a clear roadmap from idea to demo", "Get coached at every milestone", "Ship with your own APIs in the API Lab", "Build a portfolio-grade prototype"] },
              { icon: "🧑‍🏫", title: "Faculty", points: ["Publish course and capstone challenges", "AI-drafted rubrics you finalise", "Risk Radar flags silent teams early", "Promote the best work to future cohorts"] },
              { icon: "🏛️", title: "Institutions", points: ["One home for every department's challenges", "Campus API Registry for reuse", "Analytics on engagement & completion", "Learning assets compound year over year"] },
            ].map((b) => (
              <Card key={b.title} hover className="p-6">
                <span className="text-2xl" aria-hidden>{b.icon}</span>
                <h3 className="mt-3 font-display text-lg font-bold">{b.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-500">
                  {b.points.map((p, i) => (
                    <li key={i} className="flex gap-2"><span className="text-brand-500" aria-hidden>✓</span>{p}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* Journey */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="journey-heading">
          <SectionTitle eyebrow="Example challenge journey" title="From raw idea to reusable learning asset" />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" id="journey-heading">
            {JOURNEY.map((j) => (
              <li key={j.step}>
                <Card hover className="h-full p-6">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(71,79,224,0.7)]">{j.step}</span>
                  <h3 className="mt-3 font-display font-bold text-ink-900">{j.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-500">{j.desc}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6" aria-labelledby="faq-heading">
          <SectionTitle eyebrow="FAQ" title="Questions, answered" />
          <div className="space-y-3" id="faq-heading">
            {FAQS.map((f) => (
              <details key={f.q} className="glass group rounded-2xl px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-ink-800">
                  {f.q}
                  <span className="text-brand-500 transition group-open:rotate-45" aria-hidden>＋</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-500">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <Card className="relative overflow-hidden p-10 text-center sm:p-14">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50 via-transparent to-accent-400/10" aria-hidden />
            <div className="pointer-events-none absolute -top-20 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-brand-300/20 blur-3xl" aria-hidden />
            <div className="relative">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready to forge your first prototype?</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500">Bring a challenge, form a team, and let the studio crew handle the scaffolding while you build.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <LinkButton href="/signup" variant="primary" className="px-6 py-3">Create your account</LinkButton>
                <LinkButton href="/challenges" variant="outline" className="px-6 py-3">Browse live challenges</LinkButton>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-white/60 bg-white/60 py-8 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-ink-400 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Campus ProtoForge — Challenge-to-Prototype Studio</p>
          <nav aria-label="Footer" className="flex gap-5">
            <Link href="/challenges" className="hover:text-brand-600">Challenges</Link>
            <Link href="/registry" className="hover:text-brand-600">API Registry</Link>
            <Link href="/library" className="hover:text-brand-600">Library</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
