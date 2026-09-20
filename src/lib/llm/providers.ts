// ---------------------------------------------------------------------------
// BYOK provider adapters. Each adapter exposes a single `complete` call over
// the provider's HTTP chat-completions API. No SDKs required.
// ---------------------------------------------------------------------------

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmRequest {
  model: string;
  messages: LlmMessage[];
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmResult {
  text: string;
  provider: string;
  model: string;
}

interface Adapter {
  defaultBaseUrl: string;
  defaultModel: string;
  complete: (req: LlmRequest) => Promise<string>;
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

function chatCompletionText(json: Record<string, unknown>): string {
  const choices = json.choices as Array<{ message?: { content?: string }; text?: string }> | undefined;
  const first = choices?.[0];
  return first?.message?.content ?? first?.text ?? "";
}

const openAiCompatible = (defaultBaseUrl: string, defaultModel: string): Adapter => ({
  defaultBaseUrl,
  defaultModel,
  async complete(req) {
    const json = await postJson(
      `${req.baseUrl || defaultBaseUrl}/chat/completions`,
      { Authorization: `Bearer ${req.apiKey}` },
      {
        model: req.model || defaultModel,
        messages: req.messages,
        temperature: req.temperature ?? 0.4,
        max_tokens: req.maxTokens ?? 2048,
      },
    );
    return chatCompletionText(json);
  },
});

const geminiAdapter: Adapter = {
  defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
  defaultModel: "gemini-1.5-flash",
  async complete(req) {
    const model = req.model || "gemini-1.5-flash";
    const url = `${req.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${model}:generateContent?key=${encodeURIComponent(req.apiKey)}`;
    const system = req.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
    const contents = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const json = await postJson(url, {}, {
      contents,
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: { temperature: req.temperature ?? 0.4, maxOutputTokens: req.maxTokens ?? 2048 },
    });
    const candidates = json.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    return candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  },
};

export const ADAPTERS: Record<string, Adapter> = {
  openai: openAiCompatible("https://api.openai.com/v1", "gpt-4o-mini"),
  groq: openAiCompatible("https://api.groq.com/openai/v1", "llama-3.3-70b-versatile"),
  mistral: openAiCompatible("https://api.mistral.ai/v1", "mistral-small-latest"),
  xai: openAiCompatible("https://api.x.ai/v1", "grok-2-latest"),
  gemini: geminiAdapter,
};

export function providerInfo(provider: string) {
  const a = ADAPTERS[provider];
  return a ? { defaultBaseUrl: a.defaultBaseUrl, defaultModel: a.defaultModel } : null;
}
