import "server-only";

export type AiResultInterpretation = {
  headline: string;
  interpretation: string;
  nextStep: string;
  reflectionQuestions: string[];
};

export class RuntimeAiError extends Error {
  constructor(public readonly code: "CREDENTIALS_MISSING" | "UPSTREAM_ERROR" | "INVALID_RESPONSE", message: string) {
    super(message);
  }
}

function configuration() {
  const apiKey = process.env.COMPILER_API_KEY?.trim();
  const baseUrl = process.env.COMPILER_API_BASE_URL?.trim().replace(/\/$/, "");
  const model = process.env.RUNTIME_AI_MODEL?.trim() || process.env.COMPILER_MODEL?.trim() || "deepseek-v4-pro";
  if (!apiKey || !baseUrl) throw new RuntimeAiError("CREDENTIALS_MISSING", "AI result interpretation is not configured");
  let endpoint: URL;
  try {
    const configuredBase = new URL(baseUrl);
    if (configuredBase.hostname === "api.openai-next.com" && configuredBase.pathname.replace(/\/$/, "") === "") configuredBase.pathname = "/v1/";
    if (!configuredBase.pathname.endsWith("/")) configuredBase.pathname += "/";
    endpoint = new URL("chat/completions", configuredBase);
  } catch {
    throw new RuntimeAiError("CREDENTIALS_MISSING", "AI result endpoint is invalid");
  }
  if (endpoint.protocol !== "https:") throw new RuntimeAiError("CREDENTIALS_MISSING", "AI result endpoint must use HTTPS");
  return { apiKey, endpoint: endpoint.toString(), model };
}

function asText(value: unknown, limit: number): string | undefined {
  return typeof value === "string" && value.trim().length ? value.trim().replace(/\s+/g, " ").slice(0, limit) : undefined;
}

function safeUpstreamDetail(value: string): string {
  return value
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);
}

function cleanAiText(value: string, limit: number): string {
  return value
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\*\*/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, limit)
    .trim();
}

/** Recover the common "almost JSON" response emitted by some model gateways. */
function recoverLabeledResult(value: string): AiResultInterpretation | undefined {
  const field = (name: string, next: string[]) => {
    const boundary = next.map((item) => `"?${item}"?\\s*:`).join("|");
    const expression = new RegExp(`"?${name}"?\\s*:\\s*([\\s\\S]*?)(?=\\s*,\\s*(?:${boundary})|\\s*}\\s*$)`, "i");
    const match = value.match(expression);
    return match ? cleanAiText(match[1], name === "interpretation" ? 320 : name === "nextStep" ? 180 : 70) : undefined;
  };
  const headline = field("headline", ["interpretation", "nextStep", "reflectionQuestions"]);
  const interpretation = field("interpretation", ["nextStep", "reflectionQuestions"]);
  const nextStep = field("nextStep", ["reflectionQuestions"]);
  if (!headline || !interpretation || !nextStep) return undefined;
  return { headline, interpretation, nextStep, reflectionQuestions: [] };
}

function parseInterpretation(raw: string): AiResultInterpretation {
  const withoutFence = raw.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const parseJson = (input: string): unknown | undefined => {
    const candidates = [input, input.match(/\{[\s\S]*\}/)?.[0]];
    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        let decoded: unknown = JSON.parse(candidate);
        // A few compatible gateways return the JSON object once more as a
        // JSON string inside message.content. Decode at most two envelopes.
        for (let depth = 0; depth < 2 && typeof decoded === "string"; depth += 1) decoded = JSON.parse(decoded);
        return decoded;
      } catch { /* Try the next representation. */ }
    }
    // Last-resort recovery for a quoted JSON object that has been escaped but
    // not wrapped in valid outer JSON by the upstream gateway.
    if (input.includes('\\"headline\\"')) {
      try { return JSON.parse(input.replace(/\\"/g, '"').replace(/\\n/g, "\n")); } catch { /* plain-text fallback below */ }
    }
    return undefined;
  };
  const parsed = parseJson(withoutFence);
  // Some compatible models put the requested JSON object inside the
  // `interpretation` field of an otherwise valid outer response. Unwrap that
  // shape here so the UI never renders a raw JSON blob to the user.
  const outer = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined;
  const nested = typeof outer?.interpretation === "string" ? parseJson(outer.interpretation) : undefined;
  const value = nested && typeof nested === "object" && !Array.isArray(nested) ? nested : parsed;
  if (!value) {
    const recovered = recoverLabeledResult(withoutFence);
    if (recovered) return recovered;
    // Claude-compatible gateways occasionally ignore response_format while
    // still returning a useful plain-text answer. Keep the answer visibly
    // separate from the deterministic Result instead of discarding it.
    const plain = cleanAiText(withoutFence.replace(/\s+/g, " "), 700);
    if (plain.length >= 12) return {
      headline: "AI 对本次填写的解读",
      interpretation: plain.slice(0, 320),
      nextStep: "从上方确定性结果中选一项最需要补齐的事实或边界，再带着它继续下一轮。",
      reflectionQuestions: [],
    };
    throw new RuntimeAiError("INVALID_RESPONSE", "AI result was empty or unreadable");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RuntimeAiError("INVALID_RESPONSE", "AI result has an invalid shape");
  const record = value as Record<string, unknown>;
  const headline = asText(record.headline, 70);
  const interpretation = asText(record.interpretation, 320);
  const nextStep = asText(record.nextStep, 180);
  const reflectionQuestions = Array.isArray(record.reflectionQuestions)
    ? record.reflectionQuestions.map((item) => asText(item, 120)).filter((item): item is string => Boolean(item)).slice(0, 2)
    : [];
  if (!headline || !interpretation || !nextStep) throw new RuntimeAiError("INVALID_RESPONSE", "AI result omitted required fields");
  return { headline, interpretation, nextStep, reflectionQuestions };
}

/** Optional, user-triggered explanation. It has no access to Session mutation. */
export async function askRuntimeResultAi(system: string, user: string): Promise<AiResultInterpretation> {
  const { apiKey, endpoint, model } = configuration();
  const request = async (structuredOutput: boolean) => {
    try {
      return await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        ...(structuredOutput ? { response_format: { type: "json_object" } } : {}),
        max_tokens: 900,
        temperature: 0.25,
        stream: false,
      }),
      cache: "no-store",
      });
    } catch {
      throw new RuntimeAiError("UPSTREAM_ERROR", "AI result request could not be completed");
    }
  };
  // Some OpenAI-compatible gateways accept Claude-style models but reject
  // response_format. The prompt still requires JSON, so retry once without
  // that optional field before surfacing an upstream error.
  let response = await request(true);
  if (!response.ok && response.status >= 400 && response.status < 500 && response.status !== 401 && response.status !== 403) response = await request(false);
  if (!response.ok) {
    const detail = safeUpstreamDetail(await response.text().catch(() => ""));
    throw new RuntimeAiError("UPSTREAM_ERROR", `AI result provider returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  const payload: unknown = await response.json().catch(() => null);
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : undefined;
  const choices = record && Array.isArray(record.choices) ? record.choices : [];
  const first = choices[0] && typeof choices[0] === "object" ? choices[0] as Record<string, unknown> : undefined;
  const message = first?.message && typeof first.message === "object" ? first.message as Record<string, unknown> : undefined;
  const content = typeof message?.content === "string" ? message.content.trim() : "";
  if (!content) throw new RuntimeAiError("INVALID_RESPONSE", "AI result provider returned no content");
  return parseInterpretation(content);
}
