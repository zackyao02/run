"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ChoiceOption, ExecutableRun, ProgramState, ProgressValue, ResultArtifact, RunComponent, SourceRecord } from "@/src/domain/types";
import { SourceScopeNotice } from "@/src/components/source-scope-notice";
import { validateSourceAnchor } from "@/src/domain/source-anchor";
import { RunAiInterpretation } from "@/src/components/run-ai-interpretation";
import { CompileLoadingVisual } from "@/src/components/compile-loading-visual";

interface Props { run: ExecutableRun; source: SourceRecord; sessionEndpoint: string; usageEndpoint?: string; prototype?: boolean; }
const actionable = new Set(["check", "task", "choice", "input", "timer"]);
const choiceValue = (value?: ProgressValue): value is `choice:${string}` => Boolean(value?.startsWith("choice:"));

function activePath(run: ExecutableRun, progress: Record<string, ProgressValue>) {
  const actions = run.components.filter((component) => actionable.has(component.type));
  const byId = new Map(actions.map((component) => [component.id, component]));
  const path: RunComponent[] = []; const seen = new Set<string>(); let current: RunComponent | undefined = actions[0];
  while (current && !seen.has(current.id)) {
    const active: RunComponent = current;
    seen.add(active.id); path.push(active);
    if (active.type === "choice") {
      const selected = progress[active.id];
      const option: ChoiceOption | undefined = choiceValue(selected) ? active.options?.find((item) => item.id === selected.slice(7)) : undefined;
      current = option ? byId.get(option.nextId) : undefined;
    } else current = active.nextId ? byId.get(active.nextId) : actions[actions.findIndex((item) => item.id === active.id) + 1];
  }
  return path;
}

function programSnapshot(run: ExecutableRun, progress: Record<string, ProgressValue>) {
  const program = run.program;
  if (!program) return { state: undefined as ProgramState | undefined, variables: [] as Array<{ id: string; label: string; value: number; unit?: string; valueLabels?: Record<string, string> }> };
  const variables = new Map((program.variables ?? []).map((item) => [item.id, { ...item, value: item.initialValue }]));
  const states = new Map(program.states.map((state) => [state.id, state]));
  let id = program.initialState; const used = new Set<number>();
  while (used.size < program.transitions.length) {
    const index = program.transitions.findIndex((transition, offset) => !used.has(offset) && transition.from === id && (transition.when === "completed" ? Boolean(progress[transition.componentId] && progress[transition.componentId] !== "unchecked") : progress[transition.componentId] === transition.when));
    if (index < 0) break;
    const transition = program.transitions[index]; used.add(index);
    for (const effect of transition.effects ?? []) { const variable = variables.get(effect.variableId); if (variable) variable.value = Math.max(variable.min, Math.min(variable.max, variable.value + effect.delta)); }
    id = transition.to;
  }
  return { state: states.get(id), variables: [...variables.values()].map(({ min: _min, max: _max, initialValue: _initial, ...item }) => item) };
}

function stateValue(variable: { id?: string; value: number; unit?: string; valueLabels?: Record<string, string> }, run?: ExecutableRun) {
  const declared = run?.program?.variables?.find((item) => item.id === variable.id);
  return variable.valueLabels?.[String(variable.value)] ?? declared?.valueLabels?.[String(variable.value)] ?? `${variable.value}${variable.unit ?? ""}`;
}

function experienceCopy(run: ExecutableRun) {
  const copies: Record<string, { bring: string; take: string; result: string }> = {
    "1251918148732559360": { bring: "一条正在考虑的职业方向", take: "一张行业、岗位与长期选择的职业积累图", result: "职业积累地图" },
    "1307332455322529792": { bring: "一次真实或即将发生的加薪谈话", take: "一张包含标准、事实与收口动作的谈话准备卡", result: "谈话准备卡" },
    "1509654546602856448": { bring: "此刻最想完成的一件小事", take: "一份能比较方法与中断反馈的专注实验记录", result: "专注实验记录" },
    "1393937473601368064": { bring: "一个想推进但仍然模糊的目标", take: "一张标出聚焦、结果与期限缺口的目标修正卡", result: "目标修正卡" },
    "1523701957479239680": { bring: "一件一直占用注意力的未完成事项", take: "一个明确的完成、终止或回看收口", result: "任务闭合记录" },
  };
  return copies[run.sourceRef.sourceId] ?? { bring: "一个与你当前情况有关的真实问题", take: "一份根据原文规则形成的运行记录", result: "本次可用结果" };
}

function evidence(component: RunComponent, source: SourceRecord) {
  const anchor = component.source; const block = source.blocks.find((item) => item.id === anchor?.blockId);
  if (!anchor || !block || validateSourceAnchor(anchor, source)) return "此节点的原文锚点不可用。";
  return anchor.quote;
}

export function ProgramRunner({ run, source, sessionEndpoint, usageEndpoint, prototype = false }: Props) {
  const [sessionId, setSessionId] = useState<string>();
  const [sessionPending, setSessionPending] = useState(true);
  const [compileStep, setCompileStep] = useState(0);
  const [showCompileIntro, setShowCompileIntro] = useState(false);
  const [progress, setProgress] = useState<Record<string, ProgressValue>>({});
  const [currentId, setCurrentId] = useState<string>();
  const [result, setResult] = useState<ResultArtifact>();
  const [evidenceFor, setEvidenceFor] = useState<string>();
  const [error, setError] = useState<string>();
  const [usage, setUsage] = useState(run.usage ?? { started: 0, completed: 0 });
  const [timer, setTimer] = useState(0); const [timerRunning, setTimerRunning] = useState(false);
  const [parameterOption, setParameterOption] = useState<string>();
  const [localInputs, setLocalInputs] = useState<Record<string, string>>({});
  const [lastChange, setLastChange] = useState<string>();
  const path = useMemo(() => activePath(run, progress), [run, progress]);
  const current = path.find((item) => item.id === currentId) ?? path.find((item) => !progress[item.id]) ?? path[path.length - 1];
  const snapshot = useMemo(() => programSnapshot(run, progress), [run, progress]);
  const experience = useMemo(() => experienceCopy(run), [run]);
  const model = run.program?.model;
  const sequence = "";
  const options = current?.options ?? [];
  const evidenceComponent = run.components.find((component) => component.id === evidenceFor);
  // The component kind is part of a session's contract. Including it keeps an old
  // "confirm" session from being resumed after a published node becomes an input.
  const sessionVersion = `${run.schemaVersion}:${run.program?.model ?? "legacy"}:${run.program?.states.map((state) => state.id).join(".") ?? ""}:${run.components.map((component) => `${component.id}:${component.type}`).join(".")}`;

  useEffect(() => {
    let cancelled = false; const key = `zhihu-run-session:${run.sourceRef.sourceId}:${sessionVersion}`;
    setSessionId(undefined); setSessionPending(true); setError(undefined);
    const ready = (id: string, savedProgress?: Record<string, ProgressValue>) => { if (!cancelled) { localStorage.setItem(key, id); setSessionId(id); setProgress(savedProgress ?? {}); setSessionPending(false); } };
    const create = () => fetch(sessionEndpoint, { method: "POST" }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); ready(data.id); });
    const old = localStorage.getItem(key);
    (old ? fetch(`/api/v1/sessions/${old}`).then((response) => response.ok ? response.json() : null).then((data) => { if (data && data.status !== "completed") { ready(data.id, data.progress); return; } return create(); }) : create()).catch(() => { if (!cancelled) { setSessionPending(false); setError("本次运行暂未准备好，请刷新后重试。"); } });
    return () => { cancelled = true; };
  }, [run.sourceRef.sourceId, sessionEndpoint, sessionVersion]);
  useEffect(() => {
    if (prototype) return;
    setShowCompileIntro(true); setCompileStep(0);
    // Keep the official flow in lockstep with the simulated Run intro so both
    // entry points communicate the same “full article → runnable program” step.
    const first = window.setTimeout(() => setCompileStep(1), 520);
    const second = window.setTimeout(() => setCompileStep(2), 1050);
    const done = window.setTimeout(() => setShowCompileIntro(false), 1700);
    return () => { window.clearTimeout(first); window.clearTimeout(second); window.clearTimeout(done); };
  }, [prototype, run.sourceRef.sourceId]);
  useEffect(() => { if (usageEndpoint) fetch(usageEndpoint).then((response) => response.ok ? response.json() : null).then((data) => data?.usage && setUsage(data.usage)).catch(() => undefined); }, [usageEndpoint]);
  useEffect(() => { if (current?.type === "timer") setTimer(current.durationSeconds ?? 180); else { setTimerRunning(false); setTimer(0); } }, [current?.id, current?.type, current?.durationSeconds]);
  useEffect(() => { if (!timerRunning || timer <= 0) return; const tick = window.setInterval(() => setTimer((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(tick); }, [timerRunning, timer]);

  async function record(component: RunComponent, value: ProgressValue, next?: string) {
    if (!sessionId) { setError(sessionPending ? "正在准备本次运行，请稍候。" : "本次运行未准备好，请刷新后重试。"); return; } setError(undefined);
    const response = await fetch(`/api/v1/sessions/${sessionId}/progress`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ componentId: component.id, value }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "进度保存失败。"); return; }
    setProgress(data.progress ?? ((old) => ({ ...old, [component.id]: value })));
    const choice = value.startsWith("choice:") ? component.options?.find((item) => item.id === value.slice("choice:".length)) : undefined;
    setLastChange(choice ? `已选择“${choice.label}”。接下来会进入与此判断对应的路径。` : `已保存“${component.title ?? "这一步"}”。下一步将继续按文章规则判断。`);
    if (next) setCurrentId(next);
  }
  async function finish() {
    if (!sessionId) { setError(sessionPending ? "正在准备本次运行，请稍候。" : "本次运行未准备好，请刷新后重试。"); return; } const response = await fetch(`/api/v1/sessions/${sessionId}/complete`, { method: "POST" }); const data = await response.json();
    if (!response.ok) { setError("还有原文规定的状态尚未完成。"); return; } setResult(data.result);
    if (usageEndpoint) fetch(usageEndpoint).then((item) => item.ok ? item.json() : null).then((item) => item?.usage && setUsage(item.usage)).catch(() => undefined);
  }
  const completed = path.filter((item) => progress[item.id] && progress[item.id] !== "unchecked").length;
  const terminal = snapshot.state?.id === run.program?.terminalState;
  const minutes = String(Math.floor(timer / 60)).padStart(2, "0"); const seconds = String(timer % 60).padStart(2, "0");

    return <><>{showCompileIntro && <section className="compile-intro" aria-live="polite"><div className="compile-intro-card"><span className="compile-intro-kicker">知识编译引擎 · 正在装载</span><h2>把文章变成可运行程序</h2><p>从原文段落中提取条件、动作与结果，组装成这篇知识专属的可操作路径。</p><CompileLoadingVisual step={compileStep} /><div className="compile-flow">{[["读取知识原文", "载入文章段落与证据"], ["编译规则路径", "绑定条件、动作与分支"], ["生成运行程序", "准备状态、输入与结果"]].map(([title, note], index) => <div className={`compile-flow-step compile-flow-step-${index + 1} ${index <= compileStep ? "active" : ""}`} key={title}><i>{index < compileStep ? "✓" : index + 1}</i><div><strong>{title}</strong><small>{note}</small></div></div>)}</div><div className="compile-progress"><i style={{ width: `${((compileStep + 1) / 3) * 100}%` }} /></div><small className="compile-note">规则在发布前已确认；本次运行只执行原文已经写明的路径。</small></div></section>}</><main className="shell demo-run-shell program-shell"><header className="topbar demo-topbar"><Link href="/" className="brand">用<span>一下</span></Link><div className="demo-top-label">{prototype ? "产品体验样例" : "知乎知识"}</div>{prototype ? <div className="source-nav-link">知识正在运行</div> : <Link className="source-nav-link" href={`/knowledge/${run.sourceRef.sourceId}`}>阅读原文 ↗</Link>}</header><div className="container demo-run-container">
<section className="run-console demo-run-hero program-run-hero"><div className="console-copy"><div className="eyebrow console-eyebrow">用一下这篇知识</div><h1 className="run-title">{run.title}</h1><p className="lede">{run.description}</p></div><div className="program-hero-side"><div className="program-run-orb"><div className="demo-hero-mark"><span>RUN</span><strong>{sequence}</strong></div></div><div className="run-usage"><span>▶ {usage.started} 次运行</span><span>✓ {usage.completed} 次完成</span></div></div></section>
    {completed > 0 && <section className={`program-dashboard model-${model}`}><div className="program-state"><span>你现在处于</span><strong>{snapshot.state?.label ?? "开始之前"}</strong><small>{snapshot.state?.description ?? "完成当前判断后，下一步才会出现。"}</small></div><div className="program-variables">{snapshot.variables.length ? snapshot.variables.map((variable) => <div className="variable" key={variable.id}><span>{variable.label}</span><strong>{stateValue(variable, run)}</strong></div>) : <div className="variable"><span>已经走过</span><strong>{completed}/{path.length} 步</strong></div>}</div><div className="model-note">{model === "diagnosis" ? "这是一条工作状态观察路径，不对人做心理或能力判断。" : model === "micro_lab" ? "这是一轮小实验；它帮你留下观察，不替你承诺现实结果。" : model === "dialogue_rehearsal" ? "你的选择会改变谈话准备路径；程序不会临场编造话术。" : model === "parameter_sandbox" ? "先选择要核对的维度，再带入一条真实事实。" : "每一步都只使用发布前确认过的文章规则。"}</div></section>}
    {lastChange && !result && <div className="run-change-feedback" role="status"><span>刚刚发生了什么</span><strong>{lastChange}</strong></div>}
    <div className="path-radar" aria-label="本次路径"><span>本次路径 · {Math.min(completed + 1, path.length)}/{path.length}</span>{path.map((item, index) => <div className={progress[item.id] && progress[item.id] !== "unchecked" ? "path-radar-node done" : item.id === current?.id ? "path-radar-node active" : "path-radar-node"} key={item.id}><i>{progress[item.id] && progress[item.id] !== "unchecked" ? "✓" : index + 1}</i><small>{item.title}</small></div>)}</div>
    {!result && current && <section className={`program-stage stage-${model}`}>
      {model === "parameter_sandbox" ? <div className="sandbox-visual"><span>RULE SANDBOX</span><strong>{stateValue(snapshot.variables.find((item) => item.id === "dimension") ?? { value: 0 }, run)}</strong><small>选择维度后，写下一句事实；系统只记录你对这条原文规则的有限判断。</small><div><i /> <i /> <i /></div></div> : model === "dialogue_rehearsal" ? <div className="dialogue-bubble other"><small>{current.speaker ?? "谈话准备"}</small><strong>{current.utterance ?? current.title}</strong><p>这一步需要你写下一句准备带进谈话的事实或标准。</p></div> : model === "scenario_simulator" ? <div className="scene-card"><span>SCENE</span><strong>{current.utterance ?? current.title}</strong><small>{current.description}</small></div> : model === "micro_lab" && current.type === "timer" ? <div className="lab-timer"><span>本轮实验计时</span><strong>{minutes}:{seconds}</strong><button className="secondary" onClick={() => setTimerRunning((value) => !value)}>{timerRunning ? "暂停" : timer > 0 ? "开始" : "计时结束"}</button></div> : model === "diagnosis" ? <div className="diagnosis-map"><span>OBSERVATION PATH</span>{path.map((item) => <div className={progress[item.id] ? "trace-hit" : "trace-gap"} key={item.id}>{progress[item.id] ? "✓" : "?"} {item.title}</div>)}</div> : <div className="program-visual-fallback"><span>RUNNING KNOWLEDGE</span><strong>{current.title}</strong><small>完成当前选择后，右侧会出现该路径的下一步与结果。</small><div className="visual-pulse"><i /><i /><i /></div><img className="kanshan-stage-mascot" src="/mascot/liu-kanshan-wave.gif" alt="刘看山陪你运行这篇知识" /></div>}
      <div className="program-action"><div className="step-count">{current.type === "input" ? "你的实际情况" : "当前这一步"}</div><h2>{current.title}</h2><p>{current.description}</p>{current.type === "choice" && options.length ? (model === "parameter_sandbox" && options.some((option) => option.value !== undefined) ? <div className="sandbox-control"><input type="range" min={Math.min(...options.map((option) => option.value ?? 0))} max={Math.max(...options.map((option) => option.value ?? 0))} step="1" value={options.find((option) => option.id === parameterOption)?.value ?? options[0].value ?? 0} onChange={(event) => { const value = Number(event.target.value); setParameterOption(options.reduce((best, option) => Math.abs((option.value ?? 0) - value) < Math.abs((best.value ?? 0) - value) ? option : best).id); }} /><div>{options.map((option) => <button className={`parameter-option ${parameterOption === option.id ? "selected" : ""}`} key={option.id} onClick={() => setParameterOption(option.id)}>{option.label}</button>)}</div><button className="primary" disabled={!sessionId} onClick={() => { const option = options.find((item) => item.id === (parameterOption ?? options[0]?.id)); if (option) record(current, `choice:${option.id}`, option.nextId); }}>{sessionPending ? "正在准备运行…" : "按这个判断继续 →"}</button></div> : <div className="choice-stack">{options.map((option) => <button className="decision-card normal" disabled={!sessionId} key={option.id} onClick={() => record(current, `choice:${option.id}`, option.nextId)}><span className="decision-icon">↳</span><span><strong>{option.label}</strong><small>{option.response ?? "选择后会进入不同的下一步"}</small></span></button>)}</div>) : current.type === "input" ? <div className="program-input"><label><span>写一句与你当前情况有关的事实</span><textarea value={localInputs[current.id] ?? ""} maxLength={160} placeholder={current.title?.replace(/^写下|^写/, "例如：") ?? "例如：我希望先确认本季度的表现标准"} onChange={(event) => setLocalInputs((items) => ({ ...items, [current.id]: event.target.value }))} /></label><small>它会保留在本次结果中。下一步会请你按文章规则做判断；只有你主动使用 AI 时，才会把它发送给模型。</small><button className="primary event-button" disabled={!localInputs[current.id]?.trim() || !sessionId} onClick={() => record(current, "matched")}>{sessionPending ? "正在准备运行…" : "保存事实，继续判断 →"}</button></div> : <button className="primary event-button" disabled={!sessionId || (current.type === "timer" && timer > 0)} onClick={() => record(current, current.type === "check" ? "normal" : "matched")}>{sessionPending ? "正在准备运行…" : current.type === "timer" ? "记录这一段实验" : model === "micro_lab" ? "记录这轮观察" : "确认并进入下一步"}</button>}{!sessionId && <small className="session-ready-note">{sessionPending ? "正在为你建立本次运行…" : "本次运行暂未建立，请刷新页面重试。"}</small>}<div className="evidence-inline"><span>为什么这样判断</span><mark>“{evidence(current, source)}”</mark><button className="evidence-trigger" onClick={() => setEvidenceFor(current.id)}>查看原文 ↗</button></div></div>
    </section>}
    {!result && <div className="game-nav program-nav">{completed === path.length && terminal ? <button className="primary complete-button" disabled={!sessionId} onClick={finish}>{sessionPending ? "正在准备运行…" : "生成本次程序结果 →"}</button> : <span>完成当前事件后，系统会按原文规则迁移状态。</span>}</div>}
    {result && <section className="solution-result program-result"><div className="result-head"><div><div className="eyebrow">这次你可以带走</div><h1>{result.finalState?.label ?? experience.result}</h1><p>{result.summary}</p><SourceScopeNotice source={source} /></div><div className="result-check">✓</div></div>{Object.keys(localInputs).length > 0 && <div className="goal-artifact local-fact-artifact"><span>你带进这次运行的真实情况</span>{Object.entries(localInputs).map(([componentId, value]) => <div key={componentId}><small>{run.components.find((component) => component.id === componentId)?.title ?? "本次填写"}</small><strong>{value}</strong></div>)}</div>}{result.variables?.length ? <div className="goal-artifact program-state-artifact"><span>本次状态</span><div className="result-state-cards">{result.variables.map((variable) => <span key={variable.id}><small>{variable.label}</small><strong>{stateValue(variable, run)}</strong></span>)}</div></div> : null}<div className="result-map">{result.items.map((item) => <div className="map-node" key={item.componentId}><span className="map-index">{item.status === "risk" || item.status === "not_matched" ? "!" : "✓"}</span><div><small>你走过的这一步</small><strong>{item.title}</strong><span>{item.status.startsWith("choice:") ? "这个判断改变了后续路径" : "已记录到本次结果"}</span></div>{item.source && <button onClick={() => setEvidenceFor(item.componentId)}>查看原文 ↗</button>}</div>)}</div><RunAiInterpretation sessionId={sessionId} facts={localInputs} /></section>}
    {error && <p className="error-message">{error}</p>}
    {evidenceComponent && <div className="evidence-backdrop" role="presentation" onClick={() => setEvidenceFor(undefined)}><aside className="evidence-sheet" role="dialog" aria-modal="true" aria-label="原文依据" onClick={(event) => event.stopPropagation()}><div className="evidence-head"><div><span>EVIDENCE · 原文依据</span><h3>{evidenceComponent.title}</h3></div><button aria-label="关闭" onClick={() => setEvidenceFor(undefined)}>×</button></div><div className="evidence-source"><span className="source-pulse" />已定位到知识源锚点</div><p className="evidence-text">{(() => { const anchor = evidenceComponent.source; const block = source.blocks.find((item) => item.id === anchor?.blockId); if (!anchor || !block || validateSourceAnchor(anchor, source)) return "此节点的原文锚点不可用。"; return <>{block.text.slice(0, anchor.startOffset)}<mark>{block.text.slice(anchor.startOffset, anchor.endOffset)}</mark>{block.text.slice(anchor.endOffset)}</>; })()}</p></aside></div>}
  </div></main></>;
}
