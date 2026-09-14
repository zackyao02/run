import "server-only";

export class CompilerModelError extends Error {
  constructor(public readonly code: "CREDENTIALS_MISSING" | "UPSTREAM_ERROR" | "INVALID_RESPONSE", message: string) {
    super(message);
  }
}

function safeUpstreamDetail(value: string): string {
  return value
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function configuration() {
  const apiKey = process.env.COMPILER_API_KEY?.trim();
  const baseUrl = process.env.COMPILER_API_BASE_URL?.trim().replace(/\/$/, "");
  const model = process.env.COMPILER_MODEL?.trim() ?? "deepseek-v4-pro";
  if (!apiKey || !baseUrl) throw new CompilerModelError("CREDENTIALS_MISSING", "Compiler API credentials are not configured");
  let endpoint: URL;
  try {
    const configuredBase = new URL(baseUrl);
    // Credits' OpenAI-compatible API is rooted at /v1. Accept the common
    // copied root URL as a convenience, but never rewrite another provider.
    if (configuredBase.hostname === "api.openai-next.com" && configuredBase.pathname.replace(/\/$/, "") === "") {
      configuredBase.pathname = "/v1/";
    }
    if (!configuredBase.pathname.endsWith("/")) configuredBase.pathname += "/";
    endpoint = new URL("chat/completions", configuredBase);
  } catch {
    throw new CompilerModelError("CREDENTIALS_MISSING", "Compiler API base URL is invalid");
  }
  if (endpoint.protocol !== "https:") throw new CompilerModelError("CREDENTIALS_MISSING", "Compiler API base URL must use HTTPS");
  return { apiKey, endpoint: endpoint.toString(), model };
}

/**
 * Server-only OpenAI-compatible client. It is called during protected content
 * compilation only; no runtime route imports this module.
 */
export async function askCompilerModel(system: string, user: string): Promise<string> {
  const { apiKey, endpoint, model } = configuration();
  let lastResponseShape = "no JSON response";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: `${user}${attempt ? "\n请立即输出符合要求的 JSON 对象。" : ""}` },
          ],
          response_format: { type: "json_object" },
          // The compiler needs a final JSON object, not a visible reasoning
          // trace. Disabling thinking also avoids its higher default effort.
          thinking: { type: "disabled" },
          // A complete Run includes source anchors, state transitions and a
          // result artifact.  Six thousand tokens can truncate that JSON for
          // long (Chinese) sources, producing an apparently malformed reply.
          max_tokens: 12000,
          temperature: 0.1,
          stream: false,
        }),
        cache: "no-store",
      });
    } catch {
      throw new CompilerModelError("UPSTREAM_ERROR", "Compiler model request could not be completed");
    }
    if (!response.ok) {
      const detail = safeUpstreamDetail(await response.text().catch(() => ""));
      throw new CompilerModelError("UPSTREAM_ERROR", `Compiler model returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
    }
    const initialPayload: unknown = await response.json().catch(() => null);
    // Some OpenAI-compatible gateways JSON-encode the provider response once
    // more. Decode only that envelope; never interpret model text as code.
    const payload: unknown = typeof initialPayload === "string"
      ? (() => { try { return JSON.parse(initialPayload) as unknown; } catch { return initialPayload; } })()
      : initialPayload;
    const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
    const choices = record && Array.isArray(record.choices) ? record.choices : [];
    const first = choices[0] && typeof choices[0] === "object" ? choices[0] as Record<string, unknown> : null;
    const message = first?.message && typeof first.message === "object" ? first.message as Record<string, unknown> : null;
    const content = typeof message?.content === "string" ? message.content.trim() : "";
    lastResponseShape = `top=${record ? Object.keys(record).sort().join(",") : typeof payload};choices=${choices.length};message=${message ? Object.keys(message).sort().join(",") : "none"};finish=${String(first?.finish_reason ?? "none")}`;
    if (content) return content;
  }
  throw new CompilerModelError("INVALID_RESPONSE", `Compiler model returned no assistant content after one retry (${lastResponseShape})`);
}
