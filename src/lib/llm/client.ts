import { prisma } from "../db";
import { decryptSecret } from "../crypto";
import type { LlmMessage, LlmResult } from "./providers";
import { ADAPTERS } from "./providers";

export type AgentName = "structure" | "track" | "coach" | "feedback" | "docs" | "retention" | "default";

export interface ResolvedLlm {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  source: "team" | "env" | "none";
}

/**
 * Resolution order:
 * 1. Team-scoped provider (BYOK, agent-scoped first, then "all")
 * 2. Platform env key for that provider
 * 3. none -> caller should use heuristic engine
 */
export async function resolveLlmConfig(agent: AgentName, teamId?: string | null): Promise<ResolvedLlm> {
  if (teamId) {
    const scoped = await prisma.llmProvider.findFirst({
      where: { teamId, agentScope: agent },
    });
    if (scoped) {
      return { provider: scoped.provider, model: scoped.model, apiKey: decryptSecret(scoped.apiKeyEnc), source: "team" };
    }
    const general = await prisma.llmProvider.findFirst({
      where: { teamId, agentScope: "all" },
      orderBy: { createdAt: "desc" },
    });
    if (general) {
      return { provider: general.provider, model: general.model, apiKey: decryptSecret(general.apiKeyEnc), source: "team" };
    }
  }

  const envMap: Record<AgentName, string> = {
    structure: process.env.LLM_STRUCTURE_MODEL || "",
    track: process.env.LLM_TRACK_MODEL || "",
    coach: process.env.LLM_COACH_MODEL || "",
    feedback: process.env.LLM_FEEDBACK_MODEL || "",
    docs: process.env.LLM_DOCS_MODEL || "",
    retention: process.env.LLM_DEFAULT_AGENT_MODEL || "",
    default: process.env.LLM_DEFAULT_AGENT_MODEL || "",
  };

  const envKeys: Record<string, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    gemini: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    xai: process.env.XAI_API_KEY,
  };

  for (const [provider, key] of Object.entries(envKeys)) {
    if (key) {
      const adapter = ADAPTERS[provider];
      return { provider, model: envMap[agent]?.replace("heuristic:auto", "") || adapter.defaultModel, apiKey: key, source: "env" };
    }
  }

  return { provider: "none", model: "heuristic", apiKey: "", source: "none" };
}

export async function llmComplete(
  agent: AgentName,
  messages: LlmMessage[],
  opts: { teamId?: string | null; temperature?: number; maxTokens?: number } = {},
): Promise<{ result: LlmResult | null; config: ResolvedLlm }> {
  const config = await resolveLlmConfig(agent, opts.teamId);
  if (config.source === "none" || !ADAPTERS[config.provider]) {
    return { result: null, config };
  }
  try {
    const text = await ADAPTERS[config.provider].complete({
      model: config.model,
      messages,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
    });
    if (!text) return { result: null, config };
    return { result: { text, provider: config.provider, model: config.model }, config };
  } catch (err) {
    console.error(`[llm] ${config.provider}/${config.model} failed:`, (err as Error).message);
    return { result: null, config };
  }
}
