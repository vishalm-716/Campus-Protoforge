export type Role = "student" | "faculty" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  department?: string | null;
  year?: number | null;
  avatar?: string | null;
  skills?: string | null;
  preferredStack?: string | null;
  title?: string | null;
}

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface ResourceLink {
  label: string;
  url: string;
}

export interface StructuredBrief {
  problemStatement: string;
  contextMotivation: string;
  constraintsAssumptions: string[];
  expectedLearners: { year: string; skills: string[] };
  successMetrics: string[];
  evaluationHints: string[];
}

export interface RubricCriterion {
  name: string;
  maxScore: number;
  score: number | null;
  aiComment?: string;
  needsHumanReview?: boolean;
}

export interface AiDraft {
  rubricScores: RubricCriterion[];
  commentSuggestions: string[];
  flags: string[];
  summary: string;
  confidence: number; // 0..1
}

export interface TrackSpec {
  level: "beginner" | "intermediate" | "advanced";
  skillTags: string[];
  syllabusLinks: ResourceLink[];
  milestones: {
    phase: string;
    title: string;
    description: string;
    checklist: string[];
    resources: ResourceLink[];
  }[];
}

export interface PitchDocs {
  readmeOutline: string[];
  onePageSummary: {
    problem: string;
    solution: string;
    techStack: string[];
    impact: string;
  };
  pitchScript: string[];
  generatedAt?: string;
  source?: string;
}

export interface CoachSuggestion {
  title: string;
  detail: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  at?: string;
}
