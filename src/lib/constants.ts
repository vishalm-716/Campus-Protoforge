export const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Design",
  "Biotechnology",
  "Mathematics",
] as const;

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export const CHALLENGE_STATUSES = ["open", "in_progress", "completed", "archived"] as const;
export const MILESTONE_STATUSES = ["todo", "in_progress", "done"] as const;
export const ARTEFACT_TYPES = ["doc", "code_repo", "demo_video", "slide", "other"] as const;
export const CHALLENGE_KINDS = ["student_idea", "official_course", "lab", "capstone"] as const;
export const REGISTRY_CATEGORIES = ["edtech", "analytics", "sports", "utilities", "other"] as const;
export const API_AUTH_TYPES = ["none", "api_key", "bearer", "basic"] as const;
export const LLM_PROVIDERS = ["openai", "groq", "mistral", "gemini", "xai"] as const;

export const AGENTS = [
  { name: "Idea Structurer", slug: "structure-challenge", desc: "Turns raw ideas into standardized challenge briefs." },
  { name: "Track Generator", slug: "generate-track", desc: "Builds milestone roadmaps personalized to student skills." },
  { name: "Prototype Coach", slug: "prototype-coach", desc: "Per-milestone guidance, next steps, and concept explainers." },
  { name: "Feedback Agent", slug: "feedback-draft", desc: "Drafts rubric scores and comments for faculty review." },
  { name: "Docs & Pitch", slug: "pitch-docs", desc: "Generates README outlines, summaries, and pitch scripts." },
  { name: "Retention Radar", slug: "retention-summary", desc: "Flags at-risk teams and suggests nudges." },
] as const;

export const RUBRIC_TEMPLATE = [
  { name: "Problem clarity", maxScore: 10 },
  { name: "Technical depth", maxScore: 25 },
  { name: "Prototype completeness", maxScore: 25 },
  { name: "Use of APIs / integrations", maxScore: 15 },
  { name: "Documentation & pitch", maxScore: 15 },
  { name: "Teamwork & process", maxScore: 10 },
] as const;

export const API_CATEGORIES_LABELS: Record<string, string> = {
  edtech: "EdTech",
  analytics: "Analytics",
  sports: "Sports",
  utilities: "Utilities",
  other: "Other",
};
