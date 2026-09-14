"use client";

import { useState } from "react";

type Interpretation = { headline: string; interpretation: string; nextStep: string; reflectionQuestions: string[] };

export function RunAiInterpretation({ sessionId, facts }: { sessionId?: string; facts: Record<string, string> }) {
  const [result, setResult] = useState<Interpretation>();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const hasFacts = Object.values(facts).some((value) => value.trim().length > 0);

  async function interpret() {
    if (!sessionId) return;
    setStatus("loading");
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/ai-result`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts }) });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== "object" || !("interpretation" in data)) throw new Error("AI_RESULT_UNAVAILABLE");
      setResult((data as { interpretation: Interpretation }).interpretation); setStatus("idle");
    } catch { setStatus("error"); }
  }

  return <section className="ai-result-panel run-ai-result-panel">
    <div className="ai-result-panel-head"><div><div className="eyebrow">可选 AI 辅助</div><h2>把这次结果变成你的下一步</h2><p>AI 只会在你点击后参考本次路径、你写下的事实和关联原文，帮你把下一步说得更贴近自己的场景；不会改变程序结论或原文规则。</p></div><div className="ai-mark" aria-hidden="true">AI</div></div>
    {!result && <div className="ai-result-action"><p>{hasFacts ? "你的事实会只用于本次整理。请不要填写隐私、密码或其他敏感信息。" : "你没有填写额外事实，AI 将只解释本次路径与原文规则。"}</p><button className="primary" disabled={!sessionId || status === "loading"} onClick={interpret}>{status === "loading" ? "正在整理你的下一步…" : "让 AI 整理下一步 →"}</button>{status === "error" && <small className="ai-result-error">AI 暂时不可用；上方的路径、原文依据和确定性结果不受影响。</small>}</div>}
    {result && <div className="ai-result-output"><span>AI 辅助整理 · 仅供本次运行参考</span><h3>{result.headline}</h3><p>{result.interpretation}</p><div className="ai-next-step"><small>你现在可以做</small><strong>{result.nextStep}</strong></div>{result.reflectionQuestions.length > 0 && <div className="ai-reflection"><small>继续细化前，可以想想</small><ul>{result.reflectionQuestions.map((question) => <li key={question}>{question}</li>)}</ul></div>}</div>}
  </section>;
}
