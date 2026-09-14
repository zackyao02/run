"use client";

import { useEffect, useMemo, useState } from "react";
import type { DemoKnowledge } from "@/src/data/demo-knowledge";
import { buildDemoResultContext } from "@/src/domain/demo-result-context";

type Interpretation = {
  headline: string;
  interpretation: string;
  nextStep: string;
  reflectionQuestions: string[];
};

export function AiResultInterpretation({ article, answers }: { article: DemoKnowledge; answers: Record<string, string> }) {
  const [result, setResult] = useState<Interpretation>();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const deterministic = useMemo(() => buildDemoResultContext(article, answers), [article, answers]);
  const cacheKey = useMemo(() => `zhihu-run-demo-ai:${article.id}:${encodeURIComponent(JSON.stringify(deterministic))}`, [article.id, deterministic]);
  const actionLabel = article.kind === "rental" ? "整理我的看房核验问题" : article.kind === "meeting" ? "整理我的下次会议开场" : article.kind === "feedback" ? "润色我的追问话术" : "整理我的最小试验";

  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(cacheKey);
      setResult(cached ? JSON.parse(cached) as Interpretation : undefined);
    } catch { setResult(undefined); }
    setStatus("idle");
  }, [cacheKey]);

  async function interpret() {
    setStatus("loading");
    try {
      const response = await fetch(`/api/v1/demo/${article.id}/ai-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== "object" || !("interpretation" in data)) throw new Error("AI_RESULT_UNAVAILABLE");
      const interpretation = (data as { interpretation: Interpretation }).interpretation;
      setResult(interpretation);
      try { window.localStorage.setItem(cacheKey, JSON.stringify(interpretation)); } catch { /* caching never blocks a result */ }
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return <section className="ai-result-panel">
    <div className="ai-result-panel-head"><div><div className="eyebrow">AI 辅助整理</div><h2>把这次结果变成你能直接使用的版本</h2><p>AI 会基于已经得出的路径与缺口，参考你的填写把结果整理得更贴近你的场景；它不会修改程序结论或原文依据。</p></div><div className="ai-mark" aria-hidden="true">AI</div></div>
    <div className="ai-context-strip"><span>本次路径</span><strong>{deterministic.selectedPath}</strong></div>
    {!result && <div className="ai-result-action"><p>仅在你点击后，才会把本次填写、已生成结果和必要原文片段发送至已配置模型。请勿填写敏感信息。</p><button className="primary" disabled={status === "loading"} onClick={interpret}>{status === "loading" ? "正在结合你的结果整理…" : `${actionLabel} →`}</button>{status === "error" && <small className="ai-result-error">暂时无法连接 AI。你仍可使用上方已生成的确定性结果，稍后可再次尝试。</small>}</div>}
    {result && <div className="ai-result-output"><span>AI 辅助整理 · 仅供本次运行参考</span><h3>{result.headline}</h3><p>{result.interpretation}</p><div className="ai-next-step"><small>你现在可以做</small><strong>{result.nextStep}</strong></div>{result.reflectionQuestions.length > 0 && <div className="ai-reflection"><small>若要继续细化，可以想想</small><ul>{result.reflectionQuestions.map((question) => <li key={question}>{question}</li>)}</ul></div>}</div>}
  </section>;
}
