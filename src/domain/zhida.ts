import "server-only";

export type ZhidaModel = "zhida-fast-1p5" | "zhida-thinking-1p5" | "zhida-agent";

export class ZhidaError extends Error {
  constructor(public readonly code: "CREDENTIALS_MISSING" | "UPSTREAM_ERROR" | "INVALID_RESPONSE", message: string) {
    super(message);
    this.name = "ZhidaError";
  }
}

const endpoint = "https://developer.zhihu.com/v1/chat/completions";
const allowedModels = new Set<ZhidaModel>(["zhida-fast-1p5", "zhida-thinking-1p5", "zhida-agent"]);

function configuredModel(): ZhidaModel {
  const requested = process.env.ZHIHU_ZHIDA_MODEL ?? "zhida-fast-1p5";
  return allowedModels.has(requested as ZhidaModel) ? requested as ZhidaModel : "zhida-fast-1p5";
}

export async function askZhida(system: string, user: string): Promise<string> {
  const secret = process.env.ZHIHU_ACCESS_SECRET?.trim();
  if (!secret) throw new ZhidaError("CREDENTIALS_MISSING", "Zhida Access Secret is not configured");

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: configuredModel(),
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        stream: false,
      }),
      cache: "no-store",
    });
  } catch {
    throw new ZhidaError("UPSTREAM_ERROR", "Zhida request could not be completed");
  }
  if (!response.ok) throw new ZhidaError("UPSTREAM_ERROR", `Zhida returned HTTP ${response.status}`);

  const payload: unknown = await response.json().catch(() => null);
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
  const choices = record && Array.isArray(record.choices) ? record.choices : [];
  const first = choices[0] && typeof choices[0] === "object" ? choices[0] as Record<string, unknown> : null;
  const message = first?.message && typeof first.message === "object" ? first.message as Record<string, unknown> : null;
  const content = typeof message?.content === "string" ? message.content.trim() : "";
  if (!content) throw new ZhidaError("INVALID_RESPONSE", "Zhida returned no assistant content");
  return content;
}
