import { json, jsonError, readJson, requireApiUser, isNextResponse } from "@/lib/api-helpers";
import { llmComplete } from "@/lib/llm/client";
import type { LlmMessage } from "@/lib/llm/providers";

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isNextResponse(user)) return user;

  const body = await readJson<{ agent?: string; messages: LlmMessage[]; teamId?: string; temperature?: number }>(req);
  if (!body?.messages?.length) return jsonError("messages required");

  const agent = (body.agent ?? "default") as "structure" | "track" | "coach" | "feedback" | "docs" | "retention" | "default";

  const { result, config } = await llmComplete(agent, body.messages, { teamId: body.teamId, temperature: body.temperature });
  if (!result) {
    return json(
      {
        error: "No LLM provider configured for this scope. Add a team key in AI Providers or set env keys.",
        config: { provider: config.provider, source: config.source },
      },
      503,
    );
  }
  return json({ text: result.text, provider: result.provider, model: result.model });
}
