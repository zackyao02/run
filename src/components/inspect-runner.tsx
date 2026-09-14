"use client";

import { useEffect, useMemo, useState } from "react";
import type { CheckValue, ExecutableRun, ProgressValue, ResultArtifact, RunComponent, SourceRecord } from "@/src/domain/types";
import { validateSourceAnchor } from "@/src/domain/source-anchor";
import { SourceScopeNotice } from "@/src/components/source-scope-notice";

interface InspectRunnerProps {
  run: ExecutableRun;
  source: SourceRecord;
  sessionEndpoint: string;
  modeLabel?: string;
  usageEndpoint?: string;
}

function HighlightedEvidence({ component, source }: { component: RunComponent; source: SourceRecord }) {
  const anchor = component.source;
  const block = source.blocks.find((candidate) => candidate.id === anchor?.blockId);
  if (!anchor || !block) return <p>来源段落不可用，正式发布时必须拦截。</p>;
  const start = anchor.startOffset;
  const end = anchor.endOffset;
  if (validateSourceAnchor(anchor, source)) return <p>引用与 offset 无法在来源段落中精确定位，正式发布时必须拦截。</p>;
  return <p className="evidence-text">{block.text.slice(0, start)}<mark>{block.text.slice(start, end)}</mark>{block.text.slice(end)}</p>;
}

function statusLabel(value: ProgressValue) {
  if (value === "normal" || value === "matched") return "正常";
  if (value === "risk" || value === "not_matched") return "风险";
  if (value === "needs_review") return "需要复核";
  return "待扫描";
}

type DemoKind = "water" | "scan" | "verify" | "observe";

function demoKindFor(component: RunComponent, index: number): DemoKind {
  const text = `${component.title ?? ""} ${component.description ?? ""}`;
  if (/水压|水龙头|用水点/.test(text)) return "water";
  if (/水渍|墙角|窗边|痕迹/.test(text)) return "scan";
  if (/身份|证件|核对|材料/.test(text)) return "verify";
  return (["observe", "scan", "verify"] as const)[index % 3];
}

function StickFigureDemo({ component, index }: { component: RunComponent; index: number }) {
  const kind = demoKindFor(component, index);
  const label = kind === "water" ? "打开用水点并观察变化" : kind === "scan" ? "移动视线扫描可疑位置" : kind === "verify" ? "拿出材料逐项核对" : "靠近对象并完成观察";

  return <div className={`stick-demo demo-${kind}`} role="img" aria-label={`动作示范：${label}`}>
    <div className="demo-label"><span>动作示范</span><strong>{label}</strong></div>
    <svg viewBox="0 0 320 260" aria-hidden="true">
      <defs>
        <linearGradient id={`beam-${index}`} x1="0" x2="1"><stop stopColor="#a99aff" stopOpacity=".7" /><stop offset="1" stopColor="#a99aff" stopOpacity="0" /></linearGradient>
      </defs>
      <path className="demo-ground" d="M28 222H292" />
      <g className="figure">
        <circle className="figure-head" cx="126" cy="79" r="18" />
        <path className="figure-body" d="M126 98L126 158" />
        <path className="figure-arm figure-arm-back" d="M126 112L92 142" />
        <path className="figure-arm figure-arm-front" d="M126 112L165 126" />
        <path className="figure-leg figure-leg-back" d="M126 158L98 216" />
        <path className="figure-leg figure-leg-front" d="M126 158L158 216" />
      </g>

      {kind === "water" && <g className="water-scene">
        <path className="fixture-line" d="M196 91V121H240V141" />
        <path className="fixture-line" d="M225 91V121" />
        <path className="tap-handle" d="M185 91H207M196 81V101" />
        <path className="tap-handle second" d="M214 91H236M225 81V101" />
        <path className="water-drop drop-one" d="M235 154C235 146 240 143 240 137C240 143 245 146 245 154A5 5 0 01235 154Z" />
        <path className="water-drop drop-two" d="M235 177C235 169 240 166 240 160C240 166 245 169 245 177A5 5 0 01235 177Z" />
        <path className="signal-wave" d="M255 139Q273 157 255 175" />
        <path className="signal-wave wave-two" d="M266 131Q292 157 266 183" />
      </g>}

      {kind === "scan" && <g className="scan-scene">
        <path className="wall-edge" d="M222 38V222" />
        <path className="stain" d="M245 91c19-12 33 4 26 18 16 8 8 30-9 27-8 16-31 6-26-10-16-7-8-28 9-35Z" />
        <g className="flashlight">
          <path className="flash-body" d="M158 122L183 132L174 148L149 134Z" />
          <path className="flash-beam" fill={`url(#beam-${index})`} d="M178 128L272 75L282 157L175 147Z" />
        </g>
      </g>}

      {kind === "verify" && <g className="verify-scene">
        <g className="id-card">
          <rect x="186" y="83" width="90" height="116" rx="12" />
          <circle cx="214" cy="117" r="13" />
          <path d="M197 145H265M197 160H254M197 175H238" />
        </g>
        <g className="check-spark"><circle cx="272" cy="74" r="18" /><path d="M263 74L269 80L281 67" /></g>
      </g>}

      {kind === "observe" && <g className="observe-scene">
        <circle className="target-ring outer" cx="240" cy="125" r="47" />
        <circle className="target-ring" cx="240" cy="125" r="26" />
        <circle className="target-dot" cx="240" cy="125" r="6" />
        <path className="look-line one" d="M151 74L192 93" />
        <path className="look-line two" d="M153 86L193 103" />
      </g>}
    </svg>
    <div className="demo-caption"><span className="caption-dot" />循环播放 · 先看动作，再看标准</div>
  </div>;
}

export function InspectRunner({ run, source, sessionEndpoint, modeLabel, usageEndpoint }: InspectRunnerProps) {
  const actionable = useMemo(() => run.components.filter((component) => component.type === "check"), [run.components]);
  const [sessionId, setSessionId] = useState<string>();
  const [progress, setProgress] = useState<Record<string, CheckValue>>({});
  const [result, setResult] = useState<ResultArtifact>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [evidenceFor, setEvidenceFor] = useState<string>();
  const [error, setError] = useState<string>();
  const [usage, setUsage] = useState(run.usage ?? { started: 0, completed: 0 });

  useEffect(() => {
    let cancelled = false;
    const storageKey = `zhihu-run-session:${run.sourceRef.sourceId}`;
    const create = () => fetch(sessionEndpoint, { method: "POST" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "SESSION_CREATE_FAILED");
      if (!cancelled) { window.localStorage.setItem(storageKey, data.id); setSessionId(data.id); }
    });
    const saved = window.localStorage.getItem(storageKey);
    const restore = saved ? fetch(`/api/v1/sessions/${saved}`).then(async (response) => response.ok ? response.json() : null).then((data) => {
      if (data && data.status !== "completed" && !cancelled) {
        const next = data.progress ?? {};
        setSessionId(data.id); setProgress(next);
        const firstPending = actionable.findIndex((component) => !next[component.id] || next[component.id] === "unchecked");
        if (firstPending >= 0) setCurrentIndex(firstPending);
        return;
      }
      return create();
    }) : create();
    restore.catch(() => !cancelled && setError("暂时无法创建或恢复检查记录。"));
    return () => { cancelled = true; };
  }, [actionable, run.sourceRef.sourceId, sessionEndpoint]);

  useEffect(() => {
    if (!usageEndpoint) return;
    fetch(usageEndpoint).then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.usage) setUsage(data.usage);
    }).catch(() => undefined);
  }, [usageEndpoint]);

  const completed = useMemo(() => actionable.filter((component) => {
    const value = progress[component.id];
    return value && value !== "unchecked";
  }).length, [actionable, progress]);

  const riskCount = useMemo(
    () => actionable.filter((component) => progress[component.id] === "risk").length,
    [actionable, progress],
  );

  const current = actionable[currentIndex];
  const currentValue = current ? progress[current.id] ?? "unchecked" : "unchecked";
  const evidenceComponent = actionable.find((component) => component.id === evidenceFor);

  function checkpointState(component: RunComponent, index: number) {
    const value = progress[component.id] ?? "unchecked";
    if (value === "normal" || value === "risk") return value;
    if (index === currentIndex) return "current";
    return index > currentIndex ? "locked" : "open";
  }

  async function choose(componentId: string, value: CheckValue) {
    if (!sessionId) return;
    setError(undefined);
    const response = await fetch(`/api/v1/sessions/${sessionId}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ componentId, value }),
    });
    const data = await response.json();
    if (!response.ok) { setError("进度保存失败，请检查网络后重新提交。"); return; }
    setProgress(data.progress ?? {});
  }

  async function finish() {
    if (!sessionId) return;
    setError(undefined);
    const response = await fetch(`/api/v1/sessions/${sessionId}/complete`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setError("还有项目没有确认，完成后才能生成结果。");
      return;
    }
    setResult(data.result);
    if (usageEndpoint) fetch(usageEndpoint).then((response) => response.ok ? response.json() : null).then((next) => {
      if (next?.usage) setUsage(next.usage);
    }).catch(() => undefined);
  }

  return <main className="shell inspect-shell">
    <header className="topbar inspect-topbar"><div className="brand">用<span>一下</span></div><div className="nav-note">原文驱动的行动检查</div></header>
    <div className="container runner-container game-runner">
      <section className="run-console">
        <div className="console-copy">
          <div className="eyebrow console-eyebrow">{modeLabel ?? "Inspect Run"}</div>
          <h1 className="run-title">{run.title}</h1>
          <p className="lede">{run.description}</p>
          <p className="source-byline"><span className="source-pulse" />知识源已连接：{source.title} · {source.authorName}</p>
          <SourceScopeNotice source={source} />
        </div>
        <div className="run-usage" aria-label={`已运行 ${usage.started} 次，完成 ${usage.completed} 次`}><span>▶ {usage.started} 次运行</span><span>✓ {usage.completed} 次完成</span></div><div className="signal-console" aria-label={`已发现 ${riskCount} 个风险信号`}>
          <span>实时信号</span>
          <strong>{riskCount}</strong>
          <small>{riskCount ? "处需要回看" : "暂未发现风险"}</small>
        </div>
      </section>

      <section className="checkpoint-board" aria-label="检查路径">
        <div className="board-header">
          <div><span className="board-kicker">INSPECTION PATH</span><h2>探索路径</h2></div>
          <span className="path-progress">{completed} / {actionable.length} 已探索</span>
        </div>
        <div className="checkpoint-track">
          {actionable.map((component, index) => {
            const state = checkpointState(component, index);
            const canOpen = index <= currentIndex || state === "normal" || state === "risk";
            return <button
              type="button"
              className={`checkpoint-node ${state}`}
              key={component.id}
              disabled={!canOpen}
              onClick={() => canOpen && setCurrentIndex(index)}
              aria-current={index === currentIndex ? "step" : undefined}
              aria-label={`检查点 ${index + 1}：${component.title}，${state === "locked" ? "未解锁" : statusLabel(progress[component.id] ?? "unchecked")}`}
            >
              <span className="node-orbit"><span className="node-core">{state === "normal" ? "✓" : state === "risk" ? "!" : index + 1}</span></span>
              <span className="node-copy"><small>CHECKPOINT {String(index + 1).padStart(2, "0")}</small><strong>{component.title}</strong></span>
            </button>;
          })}
        </div>
      </section>

      {!result && current && <section className="scan-stage" key={current.id}>
        <div className="scan-visual">
          <span className="scan-ring ring-one" />
          <span className="scan-ring ring-two" />
          <span className="scan-crosshair horizontal" />
          <span className="scan-crosshair vertical" />
          <StickFigureDemo component={current} index={currentIndex} />
          <span className={`checkpoint-chip ${currentValue}`}><b>{currentIndex + 1}</b><small>当前检查点</small></span>
        </div>
        <div className="scan-content">
          <div className="step-count">CHECKPOINT {String(currentIndex + 1).padStart(2, "0")} · 现场判断</div>
          <h2>{current.title}</h2>
          <p className="step-description">{current.description}</p>
          <p className="decision-prompt">你在现场观察到的情况是？</p>
          <div className="decision-grid">
            <button className={`decision-card normal ${currentValue === "normal" ? "selected" : ""}`} onClick={() => choose(current.id, "normal")}>
              <span className="decision-icon">✓</span>
              <span><strong>符合原文标准</strong><small>标记为正常</small></span>
            </button>
            <button className={`decision-card risk ${currentValue === "risk" ? "selected" : ""}`} onClick={() => choose(current.id, "risk")}>
              <span className="decision-icon">!</span>
              <span><strong>发现异常信号</strong><small>加入风险地图</small></span>
            </button>
          </div>
          <div className="scan-footer">
            <button className="evidence-trigger" onClick={() => setEvidenceFor(current.id)}><span className="evidence-radar" />扫描这一判断的原文依据</button>
            <span className={`record-state ${currentValue}`}>{currentValue === "unchecked" ? "等待现场判断" : `${statusLabel(currentValue)} · 已记录`}</span>
          </div>
        </div>
      </section>}

      {!result && <div className="step-nav game-nav">
        <button className="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}>← 返回上一检查点</button>
        {currentIndex < actionable.length - 1
          ? <button className="primary" disabled={currentValue === "unchecked"} onClick={() => setCurrentIndex((index) => Math.min(actionable.length - 1, index + 1))}>解锁下一检查点 →</button>
          : <button className="primary complete-button" disabled={completed !== actionable.length || !sessionId} onClick={finish}>生成风险地图 →</button>}
      </div>}

      {error && <p className="error-message">{error}</p>}

      {result && <section className="result game-result">
        <div className="result-heading">
          <div><div className="eyebrow result-eyebrow">RUN COMPLETE</div><h2>这篇知识已经运行完成</h2><p>这不是分数，而是你刚刚留下的执行状态与原文证据地图。</p><SourceScopeNotice source={source} /><div className="result-usage">▶ {usage.started} 次运行　✓ {usage.completed} 次完成</div></div>
          <div className={`result-signal ${result.riskCount ? "has-risk" : "clear"}`}><strong>{result.riskCount}</strong><span>个风险信号</span></div>
        </div>
        <div className="result-map" aria-label="检查结果路径">
          {result.items.map((item, index) => <div className={`map-node ${item.status}`} key={item.componentId}>
            <span className="map-index">{item.status === "normal" ? "✓" : item.status === "risk" ? "!" : index + 1}</span>
            <div><small>CHECKPOINT {String(index + 1).padStart(2, "0")}</small><strong>{item.title}</strong><span>{statusLabel(item.status)}</span></div>
            {item.source && <button onClick={() => setEvidenceFor(item.componentId)}>定位原文 ↗</button>}
          </div>)}
        </div>
        <div className="result-legend"><span><i className="legend-dot normal" />{result.normalCount} 项正常</span><span><i className="legend-dot risk" />{result.riskCount} 项风险</span><span><i className="legend-dot unchecked" />{result.uncheckedCount} 项未确认</span></div>
      </section>}

      {evidenceComponent && <div className="evidence-backdrop" role="presentation" onClick={() => setEvidenceFor(undefined)}><aside className="evidence-sheet" role="dialog" aria-modal="true" aria-label="原文依据" onClick={(event) => event.stopPropagation()}><div className="evidence-head"><div><span>EVIDENCE SCAN · 原文依据</span><h3>{evidenceComponent.title}</h3></div><button aria-label="关闭" onClick={() => setEvidenceFor(undefined)}>×</button></div><div className="evidence-source"><span className="source-pulse" />已定位到知识中的知识源锚点</div><HighlightedEvidence component={evidenceComponent} source={source} /><p className="evidence-meta">锚点：{evidenceComponent.source?.blockId}</p></aside></div>}
    </div>
  </main>;
}
