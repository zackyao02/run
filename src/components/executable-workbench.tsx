"use client";

import { useEffect, useMemo, useState } from "react";
import { evaluateRun, type LocalInputs } from "@/src/domain/evaluator";
import { validateSourceAnchor } from "@/src/domain/source-anchor";
import type { ExecutableRun, ProgressValue, ResultArtifact, SourceRecord } from "@/src/domain/types";
import { SourceScopeNotice } from "@/src/components/source-scope-notice";

interface Props {
  run: ExecutableRun;
  source: SourceRecord;
  sessionEndpoint: string;
  modeLabel?: string;
}

function label(status: ProgressValue) {
  if (status === "matched" || status === "normal") return "已命中";
  if (status === "not_matched" || status === "risk") return "未命中";
  if (status === "needs_review") return "需要复核";
  return "未运行";
}

function HighlightedEvidence({ source, blockId, quote, startOffset, endOffset }: { source: SourceRecord; blockId?: string; quote?: string; startOffset?: number; endOffset?: number }) {
  const block = source.blocks.find((item) => item.id === blockId);
  if (!block || quote === undefined || startOffset === undefined || endOffset === undefined) return <p>来源锚点不可用。</p>;
  const error = validateSourceAnchor({ blockId: block.id, quote, startOffset, endOffset, blockHash: block.blockHash }, source);
  if (error) return <p>来源锚点校验失败，已阻止展示。</p>;
  const exact = block.text.slice(startOffset, endOffset);
  return <p className="evidence-text">{block.text.slice(0, startOffset)}<mark>{exact}</mark>{block.text.slice(endOffset)}</p>;
}

export function ExecutableWorkbench({ run, source, sessionEndpoint, modeLabel }: Props) {
  const isRuleTester = run.program?.model === "rule_tester";
  const [inputs, setInputs] = useState<LocalInputs>({});
  const [progress, setProgress] = useState<Record<string, ProgressValue>>({});
  const [sessionId, setSessionId] = useState<string>();
  const [result, setResult] = useState<ResultArtifact>();
  const [hasRun, setHasRun] = useState(false);
  const [evidenceId, setEvidenceId] = useState<string>();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();
  const checks = useMemo(() => run.components.filter((component) => component.type === "check" && component.evaluation), [run.components]);
  const statuses = useMemo(() => evaluateRun(checks, inputs), [checks, inputs]);
  const evaluatedCount = Object.keys(statuses).length;
  const matchedCount = hasRun ? Object.values(statuses).filter((status) => status === "matched").length : 0;
  const reviewCount = hasRun ? Object.values(statuses).filter((status) => status === "needs_review").length : 0;
  const inputsReady = (run.inputs ?? []).filter((input) => input.required).every((input) => (inputs[input.id] ?? "").trim().length > 0);
  const evidenceComponent = checks.find((component) => component.id === evidenceId);
  const composedDraft = useMemo(() => {
    const action = inputs.action_text?.trim();
    const scope = inputs.scope_text?.trim();
    const resultName = inputs.result_text?.trim();
    const value = inputs.impact_value?.trim();
    const unit = inputs.impact_unit?.trim();
    if (isRuleTester) return Object.values(inputs).some((item) => item.trim()) ? "输入已就绪：将按文章声明的规则运行。" : "输入一个对象后，文章中的规则会在这里开始运行。";
    if (!action && !scope && !resultName && !value && !unit) return "你填入事实后，文章中的方法会在这里实时组装成一条经历。";
    return [action, scope, resultName && `${resultName}${value ?? ""}${unit ?? ""}`].filter(Boolean).join("，") + "。";
  }, [inputs, isRuleTester]);

  useEffect(() => {
    let cancelled = false;
    try {
      const saved = window.localStorage.getItem(`zhihu-run-inputs:${run.sourceRef.sourceId}`);
      if (saved) setInputs(JSON.parse(saved) as LocalInputs);
    } catch { /* local input is optional */ }
    const storageKey = `zhihu-run-session:${run.sourceRef.sourceId}`;
    const create = () => fetch(sessionEndpoint, { method: "POST" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "SESSION_CREATE_FAILED");
      if (!cancelled) { window.localStorage.setItem(storageKey, data.id); setSessionId(data.id); }
    });
    const savedSession = window.localStorage.getItem(storageKey);
    const restore = savedSession ? fetch(`/api/v1/sessions/${savedSession}`).then(async (response) => response.ok ? response.json() : null).then((data) => {
      if (data && data.status !== "completed" && !cancelled) { setSessionId(data.id); setProgress(data.progress ?? {}); return; }
      return create();
    }) : create();
    restore.catch(() => !cancelled && setError("暂时无法创建或恢复运行记录，请稍后重试。"));
    return () => { cancelled = true; };
  }, [run.sourceRef.sourceId, sessionEndpoint]);

  function setInput(id: string, value: string) {
    const next = { ...inputs, [id]: value };
    setInputs(next);
    window.localStorage.setItem(`zhihu-run-inputs:${run.sourceRef.sourceId}`, JSON.stringify(next));
    setResult(undefined);
    setProgress({});
    setHasRun(false);
  }

  async function execute() {
    if (!sessionId) return;
    setRunning(true);
    setError(undefined);
    const nextProgress = statuses as Record<string, ProgressValue>;
    setProgress(nextProgress);
    setHasRun(true);
    for (const [componentId, value] of Object.entries(nextProgress)) {
      const response = await fetch(`/api/v1/sessions/${sessionId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId, value }),
      });
      if (!response.ok) throw new Error("PROGRESS_SAVE_FAILED");
    }
    const response = await fetch(`/api/v1/sessions/${sessionId}/complete`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "COMPLETION_FAILED");
    setResult(data.result);
    setRunning(false);
  }

  return <main className="shell inspect-shell executable-shell">
    <header className="topbar inspect-topbar"><div className="brand">用<span>一下</span></div><div className="nav-note">{modeLabel ?? "Executable Knowledge"}</div></header>
    <div className="container workbench-container">
      <section className="workbench-hero">
        <div className="eyebrow">ARTICLE → RUNNABLE PROGRAM</div>
        <h1>{run.title}</h1>
        <p className="lede">{run.description}</p>
        <p className="article-connected"><span className="source-pulse" />正在运行的知识源：{source.title}</p>
        <SourceScopeNotice source={source} />
        <div className="trace-line"><span className="trace-dot active" />输入 <span>→</span> 声明式规则 <span>→</span> 状态信号 <span>→</span> 原文证据</div>
      </section>

      <section className="input-workbench">
        <div className="section-heading"><div><span className="board-kicker">ARTICLE-GENERATED WORKBENCH</span><h2>{isRuleTester ? "输入对象，运行文章规则" : "文章已经变成下面这套操作"}</h2><p className="section-intro">{isRuleTester ? "输入只保留在当前浏览器；每条规则都能回看文章原文。" : "把经历拆成几个事实，程序会替你组装并执行原文规则。"}</p></div><span className="privacy-note">事实仅保存在当前浏览器</span></div>
        <div className="input-grid">
          {(run.inputs ?? []).map((input) => <label className="input-card" key={input.id}><span>{input.label}{input.required ? " *" : ""}</span><small>{input.description}</small>{input.type === "textarea" ? <textarea value={inputs[input.id] ?? ""} maxLength={input.maxLength} placeholder={input.placeholder} onChange={(event) => setInput(input.id, event.target.value)} /> : <input type={input.type} value={inputs[input.id] ?? ""} placeholder={input.placeholder} onChange={(event) => setInput(input.id, event.target.value)} />}</label>)}
        </div>
        <div className="generated-draft"><span>{isRuleTester ? "当前程序输入" : "实时生成的经历"}</span><strong>{composedDraft}</strong></div>
        <button className="primary execute-button" disabled={running || !sessionId || !inputsReady} onClick={() => execute().catch(() => { setRunning(false); setError("执行结果保存失败，请检查连接后重试。"); })}>{running ? "正在执行规则…" : isRuleTester ? "运行文章规则 →" : "运行这段经历 →"}</button>
      </section>

      <section className="execution-panel">
        <div className="section-heading"><div><span className="board-kicker">EXECUTION TRACE</span><h2>规则执行轨迹</h2></div><div className="trace-count"><strong>{matchedCount}</strong> / {evaluatedCount} 已命中</div></div>
        <div className="rule-grid">{checks.map((component) => { const status = progress[component.id] ?? (hasRun ? statuses[component.id] : "unchecked"); return <article className={`rule-card ${status}`} key={component.id}><div className="rule-status">{label(status)}</div><h3>{component.title}</h3><p>{component.description}</p><div className="rule-footer"><span>{component.evaluation?.operator}</span><button onClick={() => setEvidenceId(component.id)}>查看原文依据 ↗</button></div></article>; })}</div>
        {reviewCount > 0 && <p className="review-callout">有 {reviewCount} 条信号需要你人工复核。程序不会把模糊语义伪装成确定结论。</p>}
      </section>

      {result && <section className="result executable-result"><div className="eyebrow">RUN COMPLETE</div><h2>{isRuleTester ? "规则压力测试已完成" : "这段经历已经跑过一轮"}</h2><p>结果只描述规则与输入的关系，不评价现实能力、结果或价值。</p><SourceScopeNotice source={source} /><div className="result-summary"><strong>{result.matchedCount ?? 0}</strong><span>已命中</span><strong>{result.notMatchedCount ?? 0}</strong><span>未命中</span><strong>{result.needsReviewCount ?? 0}</strong><span>待复核</span></div></section>}
      {error && <p className="error-message">{error}</p>}
      {evidenceComponent && <div className="evidence-backdrop" role="presentation" onClick={() => setEvidenceId(undefined)}><aside className="evidence-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="evidence-head"><div><span>EVIDENCE TRACE · 原文依据</span><h3>{evidenceComponent.title}</h3></div><button aria-label="关闭" onClick={() => setEvidenceId(undefined)}>×</button></div><div className="evidence-source"><span className="source-pulse" />{source.title}</div><HighlightedEvidence source={source} {...evidenceComponent.source} /><p className="evidence-meta">锚点：{evidenceComponent.source?.blockId}</p></aside></div>}
    </div>
  </main>;
}
