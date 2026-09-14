"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChoiceOption, ExecutableRun, ProgramState, ProgressValue, ResultArtifact, RunComponent, SourceRecord } from "@/src/domain/types";
import { validateSourceAnchor } from "@/src/domain/source-anchor";
import { SourceScopeNotice } from "@/src/components/source-scope-notice";

interface GenericRunnerProps { run: ExecutableRun; source: SourceRecord; sessionEndpoint: string; usageEndpoint?: string; }
const isChoiceValue = (value: ProgressValue | undefined) => Boolean(value?.startsWith("choice:"));

function Evidence({ component, source }: { component: RunComponent; source: SourceRecord }) {
  const anchor = component.source;
  const block = source.blocks.find((item) => item.id === anchor?.blockId);
  if (!anchor || !block) return <p>来源段落不可用。</p>;
  const error = validateSourceAnchor(anchor, source);
  if (error) return <p>来源锚点校验失败：{error}</p>;
  return <p className="evidence-text">{block.text.slice(0, anchor.startOffset)}<mark>{block.text.slice(anchor.startOffset, anchor.endOffset)}</mark>{block.text.slice(anchor.endOffset)}</p>;
}

function statusLabel(value: ProgressValue | undefined) {
  if (isChoiceValue(value)) return "已选择";
  if (value === "matched" || value === "normal") return "已完成";
  if (value === "not_matched" || value === "risk") return "需回看";
  if (value === "needs_review") return "待复核";
  return "未开始";
}

function programCopy(capability: ExecutableRun["capability"], type: RunComponent["type"], index: number) {
  if (type === "choice") return { title: "根据原文选择路径", body: "你的选择会决定下一步出现的内容。" };
  if (capability === "practice") return { title: index === 0 ? "准备这一轮练习" : index === 1 ? "完成核心动作" : "记录本轮完成", body: "这是一次可完成、可回看的练习流程，不是待办清单。" };
  if (capability === "mission") return { title: "推进当前行动阶段", body: "完成当前阶段后，才会解锁后续行动。" };
  if (capability === "diagnose") return { title: "记录当前判断", body: "判断路径和原文证据会一起进入结果。" };
  return { title: "完成这一动作", body: "按文章原意推进，完成后解锁下一步。" };
}

/** Client mirror of Runtime path resolution; server remains the completion authority. */
function activePath(actions: RunComponent[], progress: Record<string, ProgressValue>) {
  if (!actions.length) return [];
  const byId = new Map(actions.map((item) => [item.id, item]));
  const path: RunComponent[] = []; const seen = new Set<string>(); let current: RunComponent | undefined = actions[0];
  while (current && !seen.has(current.id)) {
    seen.add(current.id); path.push(current);
    if (current.type === "choice") {
      const selected: ProgressValue | undefined = progress[current.id];
      const option: ChoiceOption | undefined = isChoiceValue(selected) ? current.options?.find((item) => item.id === selected.slice(7)) : undefined;
      current = option ? byId.get(option.nextId) : undefined;
    } else current = actions[actions.findIndex((item) => item.id === current?.id) + 1];
  }
  return path;
}

/** Client mirror of the declared state machine; the server remains authoritative. */
function programState(run: ExecutableRun, progress: Record<string, ProgressValue>): ProgramState | undefined {
  const program = run.program;
  if (!program) return undefined;
  const byId = new Map(program.states.map((state) => [state.id, state]));
  let stateId = program.initialState;
  const consumedTransitions = new Set<number>();
  while (consumedTransitions.size < program.transitions.length) {
    const transitionIndex = program.transitions.findIndex((item, index) => {
      if (consumedTransitions.has(index)) return false;
      if (item.from !== stateId) return false;
      const value = progress[item.componentId];
      return item.when === "completed" ? Boolean(value && value !== "unchecked") : value === item.when;
    });
    if (transitionIndex < 0) break;
    const transition = program.transitions[transitionIndex];
    consumedTransitions.add(transitionIndex);
    stateId = transition.to;
  }
  return byId.get(stateId);
}

export function GenericRunner({ run, source, sessionEndpoint, usageEndpoint }: GenericRunnerProps) {
  const actions = useMemo(() => run.components.filter((item) => ["check", "task", "choice", "input"].includes(item.type)), [run.components]);
  const [sessionId, setSessionId] = useState<string>();
  const [progress, setProgress] = useState<Record<string, ProgressValue>>({});
  const [currentId, setCurrentId] = useState(actions[0]?.id);
  const [result, setResult] = useState<ResultArtifact>();
  const [evidenceFor, setEvidenceFor] = useState<string>();
  const [usage, setUsage] = useState(run.usage ?? { started: 0, completed: 0 });
  const [error, setError] = useState<string>();
  const path = useMemo(() => activePath(actions, progress), [actions, progress]);
  const current = path.find((item) => item.id === currentId) ?? path[path.length - 1];
  const currentIndex = current ? path.findIndex((item) => item.id === current.id) : 0;

  useEffect(() => {
    let cancelled = false;
    const storageKey = `zhihu-run-session:${run.sourceRef.sourceId}`;
    const create = () => fetch(sessionEndpoint, { method: "POST" }).then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error); if (!cancelled) { window.localStorage.setItem(storageKey, data.id); setSessionId(data.id); } });
    const saved = window.localStorage.getItem(storageKey);
    const restore = saved ? fetch(`/api/v1/sessions/${saved}`).then(async (r) => r.ok ? r.json() : null).then((data) => {
      if (data && data.status !== "completed" && !cancelled) { setSessionId(data.id); setProgress(data.progress ?? {}); return; }
      return create();
    }) : create();
    restore.catch(() => !cancelled && setError("暂时无法创建或恢复运行记录。"));
    return () => { cancelled = true; };
  }, [run.sourceRef.sourceId, sessionEndpoint]);
  useEffect(() => { if (!usageEndpoint) return; fetch(usageEndpoint).then((r) => r.ok ? r.json() : null).then((d) => d?.usage && setUsage(d.usage)).catch(() => undefined); }, [usageEndpoint]);

  async function choose(component: RunComponent, value: ProgressValue, nextId?: string) {
    if (!sessionId) return;
    setError(undefined);
    const response = await fetch(`/api/v1/sessions/${sessionId}/progress`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ componentId: component.id, value }) });
    const data = await response.json();
    if (!response.ok) { setError("进度保存失败，请重试。"); return; }
    setProgress(data.progress ?? {});
    if (nextId && actions.some((item) => item.id === nextId)) setCurrentId(nextId);
  }

  async function finish() {
    if (!sessionId) return;
    const response = await fetch(`/api/v1/sessions/${sessionId}/complete`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) { setError("当前路径还有步骤没有完成。"); return; }
    setResult(data.result);
    if (usageEndpoint) fetch(usageEndpoint).then((r) => r.ok ? r.json() : null).then((d) => d?.usage && setUsage(d.usage)).catch(() => undefined);
  }

  const completed = path.filter((item) => progress[item.id] && progress[item.id] !== "unchecked").length;
  const currentValue = current ? progress[current.id] : undefined;
  const state = useMemo(() => programState(run, progress), [run, progress]);
  const evidence = actions.find((item) => item.id === evidenceFor);
  const currentCopy = current ? programCopy(run.capability, current.type, currentIndex) : { title: "等待步骤", body: "" };
  const actionButton = run.capability === "practice" ? "完成这一轮练习" : run.capability === "mission" ? "确认阶段已推进" : run.capability === "diagnose" ? "记录这个判断" : "完成这一步";

  return <main className="shell inspect-shell"><header className="topbar inspect-topbar"><div className="brand">用<span>一下</span></div><div className="nav-note">文章结构驱动的 {run.capability} Run</div></header><div className="container runner-container game-runner">
    <section className="run-console"><div className="console-copy"><div className="eyebrow console-eyebrow">{run.capability.toUpperCase()} PROGRAM</div><h1 className="run-title">{run.title}</h1><p className="lede">{run.description}</p><p className="source-byline"><span className="source-pulse" />知识源已连接：{source.title} · {source.authorName}</p><SourceScopeNotice source={source} /></div><div className="run-usage"><span>▶ {usage.started} 次运行</span><span>✓ {usage.completed} 次完成</span></div></section>
    <section className="checkpoint-board"><div className="board-header"><div><span className="board-kicker">SOURCE-DRIVEN STATE MACHINE</span><h2>{state ? `当前状态：${state.label}` : "执行状态"}</h2>{state?.description && <p className="source-byline">{state.description}</p>}</div><span className="path-progress">{run.program ? `${run.program.primitives.length} 个程序原语` : `${completed} / ${path.length} 已记录`}</span></div>{run.program ? <div className="checkpoint-track program-state-track">{run.program.states.map((programNode, index) => { const reached = run.program?.states.findIndex((item) => item.id === state?.id) ?? -1; const currentNode = programNode.id === state?.id; return <div className={`checkpoint-node ${index < reached ? "normal" : currentNode ? "current" : "locked"}`} key={programNode.id}><span className="node-orbit"><span className="node-core">{index < reached ? "✓" : index + 1}</span></span><span className="node-copy"><small>STATE · {String(index + 1).padStart(2, "0")}</small><strong>{programNode.label}</strong><em>{programNode.description}</em></span></div>; })}</div> : <div className="checkpoint-track">{path.map((item, index) => <button type="button" className={`checkpoint-node ${progress[item.id] ? "normal" : index === currentIndex ? "current" : "locked"}`} key={item.id} disabled={index > currentIndex && !progress[item.id]} onClick={() => setCurrentId(item.id)}><span className="node-orbit"><span className="node-core">{progress[item.id] ? "✓" : index + 1}</span></span><span className="node-copy"><small>{item.type.toUpperCase()} · {String(index + 1).padStart(2, "0")}</small><strong>{item.title ?? item.id}</strong></span></button>)}</div>}</section>
    {!result && current && <section className="scan-stage"><div className="scan-visual"><span className="scan-ring ring-one" /><span className="scan-ring ring-two" /><span className="scan-crosshair horizontal" /><span className="scan-crosshair vertical" /><div className="generic-action-visual"><span className="generic-icon">{current.type === "choice" ? "↳" : run.capability === "practice" ? "◌" : current.type === "task" ? "→" : "◇"}</span><strong>{currentCopy.title}</strong><small>{currentCopy.body}</small></div><span className={`checkpoint-chip ${currentValue ?? "unchecked"}`}><b>{currentIndex + 1}</b><small>当前步骤</small></span></div><div className="scan-content"><div className="step-count">{current.type.toUpperCase()} · STEP {String(currentIndex + 1).padStart(2, "0")}</div><h2>{current.title}</h2><p className="step-description">{current.description}</p>{current.type === "choice" && current.options ? <div className="decision-grid">{current.options.map((option) => <button className={`decision-card normal ${currentValue === `choice:${option.id}` ? "selected" : ""}`} key={option.id} onClick={() => choose(current, `choice:${option.id}`, option.nextId)}><span className="decision-icon">{option.id.slice(-1)}</span><span><strong>{option.label}</strong><small>选择后进入对应原文路径</small></span></button>)}</div> : <div className="decision-grid"><button className={`decision-card normal ${currentValue === "matched" || currentValue === "normal" ? "selected" : ""}`} onClick={() => choose(current, current.type === "check" ? "normal" : "matched")}><span className="decision-icon">✓</span><span><strong>{current.type === "check" ? "符合原文标准" : actionButton}</strong><small>写入本次运行记录</small></span></button>{current.type === "check" && <button className={`decision-card risk ${currentValue === "risk" ? "selected" : ""}`} onClick={() => choose(current, "risk")}><span className="decision-icon">!</span><span><strong>发现异常信号</strong><small>加入结果回看</small></span></button>}</div>}<div className="scan-footer"><button className="evidence-trigger" onClick={() => setEvidenceFor(current.id)}><span className="evidence-radar" />查看这一步的原文依据</button><span className={`record-state ${currentValue ?? "unchecked"}`}>{statusLabel(currentValue)} · {currentValue ? "已记录" : "等待操作"}</span></div></div></section>}
    {!result && current && <div className="step-nav game-nav"><button className="secondary" disabled={currentIndex === 0} onClick={() => setCurrentId(path[Math.max(0, currentIndex - 1)]?.id)}>← 上一步</button>{currentIndex < path.length - 1 ? <button className="primary" disabled={!currentValue} onClick={() => setCurrentId(path[currentIndex + 1]?.id)}>继续 →</button> : <button className="primary complete-button" disabled={completed !== path.length || !sessionId} onClick={finish}>生成本次结果 →</button>}</div>}
    {error && <p className="error-message">{error}</p>}
    {result && <section className="result game-result"><div className="result-heading"><div><div className="eyebrow result-eyebrow">RUN COMPLETE</div><h2>{result.headline ?? "这篇知识已经运行完成"}</h2><p>{result.summary ?? "结果来自这次执行记录，关键步骤都能回到原文依据。"}</p><SourceScopeNotice source={source} /><div className="result-usage">▶ {usage.started} 次运行　✓ {usage.completed} 次完成</div></div><div className="result-signal clear"><strong>{result.finalState?.label ?? result.items.length}</strong><span>{result.finalState ? "最终状态" : "个步骤已记录"}</span></div></div><div className="result-map">{result.items.map((item, index) => <div className={`map-node ${item.status}`} key={item.componentId}><span className="map-index">{item.status === "risk" || item.status === "not_matched" ? "!" : "✓"}</span><div><small>TRANSITION {String(index + 1).padStart(2, "0")}</small><strong>{item.title}</strong><span>{statusLabel(item.status)}</span></div>{item.source && <button onClick={() => setEvidenceFor(item.componentId)}>定位原文 ↗</button>}</div>)}</div></section>}
    {evidence && <div className="evidence-backdrop" role="presentation" onClick={() => setEvidenceFor(undefined)}><aside className="evidence-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="evidence-head"><div><span>EVIDENCE · 原文依据</span><h3>{evidence.title}</h3></div><button aria-label="关闭" onClick={() => setEvidenceFor(undefined)}>×</button></div><div className="evidence-source"><span className="source-pulse" />已定位到知识源锚点</div><Evidence component={evidence} source={source} /></aside></div>}
  </div></main>;
}
