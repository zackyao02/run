"use client";

import { useEffect, useState } from "react";

interface Candidate { workId: string; title: string; role?: "hero" | "supporting"; capability?: string; model?: string; primitives?: string[]; score?: number; reason?: string; family?: string; decision?: "priority" | "reserve"; experience?: string; goal?: string; }
interface ProgramPlan { workId: string; title: string; familyLabel: string; decision: "priority" | "reserve" | "hold"; decisionLabel: string; experience: string; goal: string; reason: string; }
interface MyContent { url: string; title: string; contentType: string; createdAt: number; likeCount: number; commentCount: number; favoriteCount: number; }
interface DraftResponse {
  id: string; state?: "draft" | "ready" | "published"; approvedRole?: "hero" | "supporting";
  source: { id: string; title: string; completeness: "full" | "bounded_excerpt"; coverage?: { disclosure?: string }; provenance?: "hackathon_event_api" | "creator_analysis_api" };
  run: { title: string; description: string; capability: string; estimatedMinutes?: number; program?: { model: string; primitives: string[] }; components: Array<{ id: string; type: string; title?: string; description?: string; source?: { quote: string } }> };
}

function stateLabel(draft: DraftResponse) {
  if (draft.state === "published") return "已发布";
  if (draft.state === "ready") return "已批准，等待 Hero";
  return "待人工预览";
}

export function OperatorConsole() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [workId, setWorkId] = useState("");
  const [draft, setDraft] = useState<DraftResponse>();
  const [drafts, setDrafts] = useState<DraftResponse[]>([]);
  const [message, setMessage] = useState("正在同步知乎官方候选内容…");
  const [busy, setBusy] = useState(false);
  const [screened, setScreened] = useState(false);
  const [myContents, setMyContents] = useState<MyContent[]>([]);
  const [myContentUrl, setMyContentUrl] = useState("");
  const [programPlans, setProgramPlans] = useState<ProgramPlan[]>([]);

  useEffect(() => {
    fetch("/api/v1/dev/provider/knowledge").then(async (response) => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setCandidates(data.candidates ?? []); setProgramPlans(data.programPlans ?? []); setWorkId(data.candidates?.[0]?.workId ?? "");
      setMessage("已载入赛事知识池的定制程序方案。公开首页只显示人工确认后发布的真实 Run。");
    }).catch(() => setMessage("候选知识暂时不可用，请检查网络后刷新。"));
    fetch("/api/v1/ops/drafts").then(async (response) => {
      const data = await response.json(); if (!response.ok) return;
      const latest = data.items?.[0] as DraftResponse | undefined;
      if (latest) { setDrafts(data.items as DraftResponse[]); setDraft(latest); setMessage("已载入最近草稿。请先完整运行预览，再批准或发布。"); }
    }).catch(() => undefined);
    fetch("/api/v1/ops/my-contents").then(async (response) => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setMyContents(data.items ?? []); setMyContentUrl(data.items?.[0]?.url ?? "");
    }).catch(() => undefined);
  }, []);

  async function screen() {
    setBusy(true); setDraft(undefined); setMessage("正在校验官方来源范围，并载入每篇文章的定制程序方案…");
    try {
      const response = await fetch("/api/v1/ops/candidates/screen", { method: "POST" }); const data = await response.json();
      if (!response.ok) throw new Error(data.detail ? `${data.error}：${data.detail}` : (data.error ?? "SCREENING_FAILED"));
      setCandidates(data.candidates ?? []); setWorkId(data.candidates?.[0]?.workId ?? ""); setScreened(true);
      setMessage(`方案已确认：${data.candidates?.length ?? 0} / ${data.total} 篇进入定制编译队列。不同文章会保留不同的互动结构，不会被压成同一张清单。${data.cached ? "（已使用缓存）" : ""}`);
    } catch (error) { setMessage(`筛选失败：${error instanceof Error ? error.message : "SCREENING_FAILED"}`); } finally { setBusy(false); }
  }

  async function precompileOfficial() {
    setBusy(true); setMessage("正在把赛事知识池预编译为本地缓存草稿：只读取官方正文与定制方案，不调用任何模型…");
    try {
      const response = await fetch("/api/v1/ops/precompile-official", { method: "POST" }); const data = await response.json();
      if (!response.ok) throw new Error(data.detail ? `${data.error}：${data.detail}` : (data.error ?? "PRECOMPILE_FAILED"));
      const nextItems = (data.items ?? []) as DraftResponse[];
      setDrafts(nextItems); setDraft(nextItems[0]); setScreened(true);
      setMessage(`已缓存 ${data.total ?? nextItems.length} 份赛事文章草稿（模型调用 ${data.compilerCalls ?? 0} 次）。请选择任意一份完整预览，确认后再发布。`);
    } catch (error) { setMessage(`未能生成缓存草稿：${error instanceof Error ? error.message : "PRECOMPILE_FAILED"}`); } finally { setBusy(false); }
  }

  async function compile() {
    if (!workId) { setMessage("请先选择一篇文章。"); return; }
    setBusy(true); setDraft(undefined); setMessage("正在执行：Source Gate → Judge → Planner → Compiler → Anchor / 语义校验…");
    try {
      const response = await fetch("/api/v1/ops/compile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workId }) }); const data = await response.json();
      if (!response.ok) throw new Error(data.detail ? `${data.error}：${data.detail}` : (data.error ?? "COMPILE_FAILED"));
      const next = { ...data, state: "draft" as const }; setDrafts((existing) => [next, ...existing.filter((item) => item.id !== data.id)]); setDraft(next); setMessage("草稿通过自动校验。下一步必须从头到尾运行内部预览，并核对每项原文证据。");
    } catch (error) { setMessage(`未生成草稿：${error instanceof Error ? error.message : "COMPILE_FAILED"}`); } finally { setBusy(false); }
  }

  async function compileMyContent() {
    if (!myContentUrl) { setMessage("当前账号还没有可读取的创作内容。发布文章后刷新这里即可。 "); return; }
    setBusy(true); setDraft(undefined); setMessage("正在读取本人完整正文，并执行 Source Gate → Judge → Planner → Compiler…");
    try {
      const response = await fetch("/api/v1/ops/my-contents/compile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentUrl: myContentUrl }) }); const data = await response.json();
      if (!response.ok) throw new Error(data.detail ? `${data.error}：${data.detail}` : (data.error ?? "COMPILE_FAILED"));
      const next = { ...data, state: "draft" as const }; setDrafts((existing) => [next, ...existing.filter((item) => item.id !== data.id)]); setDraft(next); setMessage("本人完整正文已通过自动校验。请从头到尾运行内部预览，并逐项核对原文证据。");
    } catch (error) { setMessage(`未生成草稿：${error instanceof Error ? error.message : "COMPILE_FAILED"}`); } finally { setBusy(false); }
  }

  async function publish(role: "hero" | "supporting") {
    if (!draft) return;
    setBusy(true); setMessage("正在保存人工预览决定…");
    try {
      const response = await fetch(`/api/v1/ops/drafts/${draft.id}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved: true, role }) }); const data = await response.json();
      if (!response.ok) throw new Error(data.detail ? `${data.error}：${data.detail}` : (data.error ?? "PUBLISH_FAILED"));
      const state = data.published ? "published" : "ready"; const next = { ...draft, state, approvedRole: role } as DraftResponse;
      setDraft(next); setDrafts((items) => items.map((item) => item.id === next.id ? next : item));
      setMessage(data.published ? `${role === "hero" ? "Hero" : "Supporting Run"} 已发布。现在可回到首页运行它。` : (data.detail ?? "Supporting 已批准，等待 Full Source Hero 发布后再公开。"));
    } catch (error) { setMessage(`未保存：${error instanceof Error ? error.message : "PUBLISH_FAILED"}`); } finally { setBusy(false); }
  }

  return <main className="shell"><header className="topbar"><div className="brand">用<span>一下</span></div><div className="nav-note">仅本地 · 内容发布流程</div></header><div className="container">
    <div className="eyebrow">AUTOMATIC ZHIHU SOURCE PIPELINE</div><h1>从知乎真实内容<br />自动生成 Run。</h1><p className="lede">这里只做来源同步、人工预览和发布决定；公开产品只展示已经发布的 Run。</p>
    <section className="card" style={{ maxWidth: 860 }}><h2>1. 赛事文章的定制程序方案</h2><p className="source-byline">10 篇官方知识不共用一张任务清单。每篇都保留适合自身内容的路径模拟、微型实验或规则沙盘结构；敏感话题只做低风险的观察、选择和练习，不输出心理诊断。</p>{programPlans.length > 0 && <div className="result-map" style={{ marginTop: 18 }}>{programPlans.map((plan) => <div className="map-node" key={plan.workId}><span className="map-index">{plan.decision === "priority" ? "★" : plan.decision === "reserve" ? "○" : "—"}</span><div><small>{plan.decisionLabel} · {plan.familyLabel}</small><strong>{plan.title} → {plan.experience}</strong><span>{plan.goal}</span><em>{plan.reason}</em></div></div>)}</div>}<div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}><button className="secondary" disabled={busy} onClick={screen}>{busy ? "正在校验…" : "重新校验赛事知识池 →"}</button><button className="primary" disabled={busy || !programPlans.length} onClick={precompileOfficial}>{busy ? "正在缓存…" : "预编译 10 篇缓存草稿（不调用模型） →"}</button></div>{screened && <label className="input-card" style={{ marginTop: 20 }}><span>进入编译队列的文章</span><select value={workId} onChange={(event) => setWorkId(event.target.value)}>{candidates.map((candidate) => <option key={candidate.workId} value={candidate.workId}>{candidate.title} · {candidate.experience} · {candidate.decision === "priority" ? "优先" : "备用"}</option>)}</select></label>}<div style={{ marginTop: 20 }}>{screened && <button className="primary" disabled={busy || !workId} onClick={compile}>{busy ? "校验与编译中…" : "按定制方案单篇重新编译 →"}</button>}</div>{screened && candidates.find((candidate) => candidate.workId === workId) && <p className="source-byline">本次程序目标：{candidates.find((candidate) => candidate.workId === workId)?.goal}</p>}<p className="source-byline" style={{ marginTop: 18 }}>{message}</p></section>
    <section className="card" style={{ maxWidth: 860, marginTop: 24 }}><h2>2. 我已发布的知乎创作</h2><p className="source-byline">系统自动同步当前 Access Secret 所属账号的已发布内容。选择后由服务端重新读取本人完整正文；不读取其他人的文章，也不使用网页抓取。</p>{myContents.length ? <><label className="input-card" style={{ marginTop: 18 }}><span>从已同步的本人创作中选择</span><select value={myContentUrl} onChange={(event) => setMyContentUrl(event.target.value)}>{myContents.map((item) => <option key={item.url} value={item.url}>{item.title} · {item.contentType} · {item.likeCount} 赞</option>)}</select></label><div style={{ marginTop: 18 }}><button className="primary" disabled={busy || !myContentUrl} onClick={compileMyContent}>{busy ? "读取与编译中…" : "自动读取全文并生成草稿 →"}</button></div></> : <p className="source-byline" style={{ marginTop: 18 }}>当前账号没有可显示的创作。你发布一篇方法型文章后，刷新此页即可自动出现。</p>}</section>
    {draft && <section className="card" style={{ maxWidth: 860, marginTop: 24 }}><h3>3. 人工预览：状态机、动作与原文证据</h3>{drafts.length > 1 && <label className="input-card" style={{ marginTop: 14 }}><span>最近受检草稿</span><select value={draft.id} onChange={(event) => setDraft(drafts.find((item) => item.id === event.target.value))}>{drafts.map((item) => <option key={item.id} value={item.id}>{item.run.title} · {item.run.capability} · {stateLabel(item)}</option>)}</select></label>}<div className="meta" style={{ marginTop: 18 }}><span className="pill">{draft.run.capability}</span>{draft.run.program?.primitives.map((primitive) => <span className="pill" key={primitive}>{primitive}</span>)}<span className="pill">{draft.source.completeness === "full" ? "Full Source" : "Bounded Excerpt"}</span>{draft.source.provenance === "creator_analysis_api" && <span className="pill">本人创作全文</span>}<span className="pill">{stateLabel(draft)}</span></div><h2>{draft.run.title}</h2><p>{draft.run.description}</p>{draft.source.coverage?.disclosure && <p className="source-byline">{draft.source.coverage.disclosure}</p>}<div className="result-map">{draft.run.components.filter((component) => component.source).map((component, index) => <div className="map-node" key={component.id}><span className="map-index">{index + 1}</span><div><small>{component.type.toUpperCase()}</small><strong>{component.title ?? component.id}</strong><span>{component.description}</span><em>“{component.source?.quote}”</em></div></div>)}</div><div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}><button className="primary" disabled={busy} onClick={() => window.open(`/dev/ops/preview/${draft.id}`, "_blank", "noopener,noreferrer")}>完整运行预览 ↗</button>{draft.source.completeness === "full" && <button className="secondary" disabled={busy || draft.state === "published"} onClick={() => publish("hero")}>确认无误，发布为 Hero →</button>}<button className="secondary" disabled={busy || draft.state === "published"} onClick={() => publish("supporting")}>{draft.state === "ready" ? "已批准，等待 Hero" : "批准为 Supporting（等待 Hero）"}</button></div></section>}
  </div></main>;
}
