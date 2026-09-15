"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { DemoKnowledge } from "@/src/data/demo-knowledge";
import { incrementDemoUsage } from "@/src/lib/demo-usage";
import { DemoUsageStats } from "@/src/components/demo-usage-stats";
import { AiResultInterpretation } from "@/src/components/ai-result-interpretation";
import { buildDemoResultContext } from "@/src/domain/demo-result-context";

type Answers = Record<string, string>;
type Stage = "form" | "result";
type RunnerProps = { article: DemoKnowledge; answers: Answers; setAnswer: (id: string, value: string) => void; stage: Stage; setStage: (stage: Stage) => void; step: number; setStep: (step: number) => void };

function sourceHref(article: DemoKnowledge, anchor: string) { return `/demo/${article.id}/source?anchor=${anchor}`; }
function hasText(value: string, min = 2) { return value.trim().length >= min; }

export function DemoKnowledgeRunner({ article, startWithCompile = false }: { article: DemoKnowledge; startWithCompile?: boolean }) {
  const router = useRouter();
  const storageKey = `zhihu-run-demo:${article.id}`;
  const [answers, setAnswers] = useState<Answers>({});
  const [stage, setStage] = useState<Stage>("form");
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [sessionUsage, setSessionUsage] = useState({ started: false, completed: false });
  const [compileStep, setCompileStep] = useState(startWithCompile ? 0 : 3);
  const sessionUsageRef = useRef({ started: false, completed: false });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved) as { answers?: Answers; stage?: Stage; step?: number; started?: boolean; completed?: boolean };
        setAnswers(data.answers ?? {}); setStage(data.stage ?? "form"); setStep(data.step ?? 0);
        sessionUsageRef.current = { started: Boolean(data.started), completed: Boolean(data.completed) };
        setSessionUsage(sessionUsageRef.current);
      }
    } catch { /* local recovery must not block a Run */ }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify({ answers, stage, step, ...sessionUsage, savedAt: new Date().toISOString() }));
  }, [answers, loaded, sessionUsage, stage, step, storageKey]);

  useEffect(() => {
    if (!startWithCompile) return;
    setCompileStep(0);
    const first = window.setTimeout(() => setCompileStep(1), 300);
    const second = window.setTimeout(() => setCompileStep(2), 650);
    const done = window.setTimeout(() => { setCompileStep(3); router.replace(`/demo/${article.id}`, { scroll: false }); }, 1050);
    return () => { window.clearTimeout(first); window.clearTimeout(second); window.clearTimeout(done); };
  }, [article.id, router, startWithCompile]);

  useEffect(() => {
    if (!loaded || stage !== "result" || sessionUsageRef.current.completed) return;
    if (!sessionUsageRef.current.started) {
      sessionUsageRef.current = { ...sessionUsageRef.current, started: true };
      incrementDemoUsage(article.id, "started");
    }
    sessionUsageRef.current = { ...sessionUsageRef.current, completed: true };
    setSessionUsage(sessionUsageRef.current); incrementDemoUsage(article.id, "completed");
  }, [article.id, loaded, stage]);

  function setAnswer(id: string, value: string) {
    if (value.trim() && !sessionUsageRef.current.started) {
      sessionUsageRef.current = { ...sessionUsageRef.current, started: true };
      setSessionUsage(sessionUsageRef.current); incrementDemoUsage(article.id, "started");
    }
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function reset() {
    setAnswers({}); setStage("form"); setStep(0);
    sessionUsageRef.current = { started: false, completed: false }; setSessionUsage(sessionUsageRef.current);
  }

  const mark = "";
  return <main className={`shell demo-run-shell accent-${article.accent}`}>
    {startWithCompile && compileStep < 3 && <CompileIntro article={article} step={compileStep} />}
    <header className="topbar demo-topbar"><Link href="/" className="brand">用<span>一下</span></Link><div className="demo-top-label">赛事模拟知识</div><Link className="source-nav-link" href={`/demo/${article.id}/source`}>阅读模拟原文 ↗</Link></header>
    <div className="container demo-run-container">
      <section className="demo-run-hero program-run-hero"><div><div className="eyebrow">用一下这篇知识</div><h1>{article.title}</h1><p>{article.promise}</p><div className="demo-meta"><span>赛事模拟知识</span><span>{article.authorName}</span><span>约 {article.estimatedMinutes} 分钟</span></div></div><div className="program-hero-side"><div className="program-run-orb"><div className="demo-hero-mark"><span>RUN</span><strong>{mark}</strong></div></div><DemoUsageStats articleId={article.id} compact /></div></section>
      <p className="demo-disclosure">这篇完整模拟知识已提前编译；你的填写和选择会改变确定性状态与结果。完成后可选用 AI 帮你把结果整理得更贴近当前场景。</p>
      <RunGuide article={article} stage={stage} answers={answers} step={step} />
      {stage === "form" && <StepRail article={article} step={step} />}
      {article.kind === "rental" && <RentalRun article={article} answers={answers} setAnswer={setAnswer} stage={stage} setStage={setStage} step={step} setStep={setStep} />}
      {article.kind === "meeting" && <MeetingRun article={article} answers={answers} setAnswer={setAnswer} stage={stage} setStage={setStage} step={step} setStep={setStep} />}
      {article.kind === "feedback" && <FeedbackRun article={article} answers={answers} setAnswer={setAnswer} stage={stage} setStage={setStage} step={step} setStep={setStep} />}
      {article.kind === "decision" && <DecisionRun article={article} answers={answers} setAnswer={setAnswer} stage={stage} setStage={setStage} step={step} setStep={setStep} />}
      {stage === "result" && <div className="demo-reset"><button className="secondary" onClick={reset}>换一种真实情况再运行</button><Link href={`/demo/${article.id}/source`} className="source-nav-link">回看模拟原文依据 ↗</Link></div>}
    </div>
  </main>;
}

function CompileIntro({ article, step }: { article: DemoKnowledge; step: number }) {
  const steps = [
    { label: "读取知识原文", detail: `载入 ${article.blocks.length} 个文章段落与证据` },
    { label: "编译规则路径", detail: "绑定条件、动作与分支" },
    { label: "生成运行程序", detail: "准备状态、输入与结果" },
  ];
  return <div className="compile-intro" role="status" aria-live="polite"><div className="compile-intro-card"><div className="compile-intro-kicker">知识编译引擎 · 正在装载</div><h2>把文章变成可运行程序</h2><p>从原文段落中提取条件、动作与结果，组装成这篇知识专属的可操作路径。</p><div className="compile-flow">{steps.map((item, index) => <div className={`compile-flow-step compile-flow-step-${index + 1} ${index <= step ? "active" : ""}`} key={item.label}><i>{index < step ? "✓" : index + 1}</i><div><strong>{item.label}</strong><small>{item.detail}</small></div></div>)}</div><div className="compile-progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div><small className="compile-note">规则在发布前已确认；本次运行只执行原文已经写明的路径。</small></div></div>;
}

function RunGuide({ article, stage, answers, step }: { article: DemoKnowledge; stage: Stage; answers: Answers; step: number }) {
  const guide = article.kind === "rental"
    ? { take: "一张入住成本与风险核验卡", now: "填入房租、通勤上限和这次绝不能忽略的条件。" }
    : article.kind === "meeting"
      ? { take: "一张会议卡点诊断路径", now: "带入最近一次会议，选择它最先卡住的节点。" }
      : article.kind === "feedback"
        ? { take: "一段可直接使用的反馈追问稿", now: "带入原话、修改对象和本轮交付边界。" }
        : { take: "一张可逆性决策边界图", now: "写下两个真实方案，只验证最会改变选择的一条信息。" };
  const state = stage === "result" ? "结果已生成" : Object.keys(answers).length ? `正在运行你的情况 · 第 ${step + 1} 步` : "从真实情况开始";
  return <section className="run-guide"><div><span>这次你会拿走</span><strong>{guide.take}</strong></div><div><span>现在要做</span><p>{guide.now}</p></div><b>{state}</b></section>;
}

function StepRail({ article, step }: { article: DemoKnowledge; step: number }) {
  const labels = article.kind === "rental" ? ["算清每月基线", "检查生活边界"]
    : article.kind === "meeting" ? ["定位会议断点", "写下修复动作"]
      : article.kind === "feedback" ? ["定位模糊反馈", "形成追问稿"]
        : ["写下两个方案", "设计最小试验"];
  return <div className="demo-step-rail" aria-label="本次运行进度">{labels.map((label, index) => <span className={index < step ? "done" : index === step ? "active" : ""} key={label}><i>{index < step ? "✓" : index + 1}</i>{label}</span>)}</div>;
}

function Evidence({ article, anchor, label = "查看原文依据" }: { article: DemoKnowledge; anchor: string; label?: string }) {
  const block = article.blocks.find((item) => item.id === anchor); const [open, setOpen] = useState(false);
  if (!block) return null;
  return <><button className="demo-evidence" type="button" onClick={() => setOpen(true)}><span>原文依据</span><strong>{block.heading ?? label}</strong><i>↗</i></button>{open && <div className="demo-evidence-backdrop" role="presentation" onMouseDown={() => setOpen(false)}><aside className="demo-evidence-sheet" role="dialog" aria-modal="true" aria-label="原文依据" onMouseDown={(event) => event.stopPropagation()}><div className="demo-evidence-sheet-head"><div><span>本次规则来自原文</span><h2>{block.heading ?? "文章原文"}</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="关闭原文依据">×</button></div><p>{block.text}</p><Link href={sourceHref(article, anchor)} className="secondary-link">阅读这篇模拟知识的完整原文 ↗</Link></aside></div>}</>;
}

function Field({ label, hint, value, placeholder, onChange, type = "text" }: { label: string; hint?: string; value: string; placeholder: string; onChange: (value: string) => void; type?: "text" | "textarea" | "number" }) {
  return <label className="demo-field"><span>{label}</span>{hint && <small>{hint}</small>}{type === "textarea" ? <textarea value={value} placeholder={placeholder} maxLength={180} onChange={(event) => onChange(event.target.value)} /> : <input min={type === "number" ? 0 : undefined} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}</label>;
}

function ResultView({ article, answers, className }: { article: DemoKnowledge; answers: Answers; className: string }) {
  const result = buildDemoResultContext(article, answers);
  return <section className={`solution-result ${className}`}><ResultHeader title={result.title} subtitle={result.summary} /><div className="goal-artifact"><span>{result.artifactTitle}</span>{result.artifactLines.map((line) => <p key={line.label}><b>{line.label}：</b>{line.value}</p>)}</div><DecisionTrail article={article} answers={answers} /><AiResultInterpretation article={article} answers={answers} /></section>;
}

function RentalRun({ article, answers, setAnswer, stage, setStage, step, setStep }: RunnerProps) {
  if (stage === "result") return <ResultView article={article} answers={answers} className="rental-result" />;
  const monthly = answers.rent !== "" && answers.fees !== "" && answers.rent !== undefined && answers.fees !== undefined ? Number(answers.rent) + Number(answers.fees) : undefined;
  const costReady = monthly !== undefined;
  const boundaryReady = Boolean(answers.commute && answers.maxCommute && answers.priority && answers.verified);
  return <section className="solution-board"><aside className="solution-radar"><span>这套房的月度基线</span><strong>{monthly ?? "—"}<small>元/月</small></strong><p>{step === 0 ? "先把标题里的月租，换算成你每个月真正需要承担的成本。" : `成本已算出。现在检查它是否值得用通勤和生活边界交换。`}</p><div className="radar-bars"><i className={costReady ? "on" : ""} /><i className={answers.commute ? "on" : ""} /><i className={answers.verified === "yes" ? "on" : ""} /></div></aside><div className="solution-work">{step === 0 ? <><div className="eyebrow">第 1 步 · 先算真实成本</div><h2>这套房每个月实际会花多少？</h2><p>先不急着判断值不值得。把房租和固定费用放在一起，得到可以拿去比较的数字。</p><div className="demo-form-grid"><Field label="月租" value={answers.rent ?? ""} placeholder="例如：4200" type="number" onChange={(value) => setAnswer("rent", value)} /><Field label="每月其他固定费用" hint="没有也请填 0" value={answers.fees ?? ""} placeholder="例如：380" type="number" onChange={(value) => setAnswer("fees", value)} /></div>{costReady && <div className="run-inline-feedback"><span>刚刚得到</span><strong>你的月度基线是 {monthly} 元</strong></div>}<button className="primary" disabled={!costReady} onClick={() => setStep(1)}>带着这个成本检查生活边界 →</button><Evidence article={article} anchor="rent" /></> : <><div className="eyebrow">第 2 步 · 决定是否继续看</div><h2>什么条件会让你不再为这套房交换？</h2><p>这一步不是打分。只核对通勤和一个你不能忽略的条件，缺少依据就先补依据。</p><div className="demo-form-grid"><Field label="实际单程通勤分钟" value={answers.commute ?? ""} placeholder="例如：55" type="number" onChange={(value) => setAnswer("commute", value)} /><Field label="你能长期接受的上限" value={answers.maxCommute ?? ""} placeholder="例如：45" type="number" onChange={(value) => setAnswer("maxCommute", value)} /></div><div className="structured-picks"><span>本轮不可妥协项</span>{["夜间噪音", "真实通勤", "提前退租条件"].map((item) => <button className={answers.priority === item ? "selected" : ""} key={item} onClick={() => setAnswer("priority", item)}>{item}</button>)}<span>它是否已有现场、路线或书面依据？</span><button className={answers.verified === "yes" ? "selected yes" : ""} onClick={() => setAnswer("verified", "yes")}>已经核验</button><button className={answers.verified === "no" ? "selected no" : ""} onClick={() => setAnswer("verified", "no")}>仍靠印象</button></div><button className="primary" disabled={!boundaryReady} onClick={() => setStage("result")}>生成我的核验结果 →</button><Evidence article={article} anchor="verify" /></>}</div></section>;
}

function MeetingRun({ article, answers, setAnswer, stage, setStage, step, setStep }: RunnerProps) {
  if (stage === "result") return <ResultView article={article} answers={answers} className="meeting-result" />;
  const path = answers.symptom === "decision" ? "决策规则" : answers.symptom === "owner" ? "行动交接" : answers.symptom === "scope" ? "议题边界" : "等待定位";
  const prompt = answers.symptom === "decision" ? "写下一条下次用于收束观点的规则" : answers.symptom === "owner" ? "写下负责人、可见产出与回看时间" : "把下次会议必须回答的问题写成一句话";
  return <section className="solution-board dialogue-board"><aside className="solution-radar dialogue-radar"><span>这次会议最先卡在</span><div className="speech-state"><small>当前落点</small><strong>{path}</strong></div><p>{step === 0 ? "先只定位一个最前面的断点。" : "已经定位断点；下一步只写一条对它有效的修复动作。"}</p></aside><div className="solution-work">{step === 0 ? <><div className="eyebrow">第 1 步 · 定位断点</div><h2>散场时，最明显少了什么？</h2><Field label="这次会议在讨论什么" value={answers.meeting ?? ""} placeholder="例如：确定新版首页是否在周五上线" onChange={(value) => setAnswer("meeting", value)} /><div className="response-choices"><button className={answers.symptom === "scope" ? "selected" : ""} onClick={() => setAnswer("symptom", "scope")}>话题不断扩张</button><button className={answers.symptom === "decision" ? "selected" : ""} onClick={() => setAnswer("symptom", "decision")}>观点很多但无法决定</button><button className={answers.symptom === "owner" ? "selected" : ""} onClick={() => setAnswer("symptom", "owner")}>决定了但没人推进</button></div>{answers.symptom && <div className="run-inline-feedback"><span>当前判断</span><strong>先修复“{path}”，不要把问题归结为某个人。</strong></div>}<button className="primary" disabled={!hasText(answers.meeting ?? "") || !answers.symptom} onClick={() => setStep(1)}>针对这个断点写修复动作 →</button><Evidence article={article} anchor={answers.symptom || "symptom"} /></> : <><div className="eyebrow">第 2 步 · 让下次会议不同</div><h2>写下一条别人也能核对的事实，再补一个修复动作</h2><div className="demo-form-grid"><Field label="最能证明这个卡点的一条事实" value={answers.evidence ?? ""} placeholder="例如：结束时没人说由谁做决定" onChange={(value) => setAnswer("evidence", value)} /><Field label={prompt} value={answers.repair ?? ""} placeholder="写下下次会议可以真实执行的一句话" onChange={(value) => setAnswer("repair", value)} /></div><button className="primary" disabled={!hasText(answers.evidence ?? "") || !hasText(answers.repair ?? "")} onClick={() => setStage("result")}>生成我的会议修复路径 →</button><Evidence article={article} anchor="repair" /></>}</div></section>;
}

function FeedbackRun({ article, answers, setAnswer, stage, setStage, step, setStep }: RunnerProps) {
  if (stage === "result") return <ResultView article={article} answers={answers} className="feedback-result" />;
  const entrance = answers.approach === "reference" ? "先确认参照" : answers.approach === "boundary" ? "先确认本轮边界" : "先确认反馈对象";
  return <section className="solution-board dialogue-board"><aside className="solution-radar dialogue-radar"><span>对方真正想说的可能是</span><div className="speech-state"><small>收到的原话</small><strong>“{answers.phrase || "再有点感觉"}”</strong></div><p>{step === 0 ? "先让模糊反馈落在一个具体对象上。" : `你会从“${entrance}”开始追问，而不是直接推倒重做。`}</p></aside><div className="solution-work">{step === 0 ? <><div className="eyebrow">第 1 步 · 把感受落到对象</div><h2>对方说的原话是什么？它最可能在说哪一部分？</h2><div className="response-choices">{["再高级一点", "内容太多了", "还是不像我们"].map((item) => <button className={answers.phrase === item ? "selected" : ""} key={item} onClick={() => setAnswer("phrase", item)}>{item}</button>)}</div><Field label="反馈可能指向的具体对象" value={answers.object ?? ""} placeholder="例如：首页标题的语气" onChange={(value) => setAnswer("object", value)} />{answers.object && <div className="run-inline-feedback"><span>你先不需要重做全部内容</span><strong>先只围绕“{answers.object}”继续问。</strong></div>}<button className="primary" disabled={!answers.phrase || !hasText(answers.object ?? "")} onClick={() => setStep(1)}>把它变成可回答的追问 →</button><Evidence article={article} anchor="object" /></> : <><div className="eyebrow">第 2 步 · 写出能继续改的问法</div><h2>你需要什么参照？这一轮准备交付到哪里？</h2><div className="demo-form-grid"><Field label="可以拿来比较的参照" value={answers.reference ?? ""} placeholder="例如：上版第二屏的表达" onChange={(value) => setAnswer("reference", value)} /><Field label="这轮准备交付到哪里" value={answers.boundary ?? ""} placeholder="例如：今天先给两版标题" onChange={(value) => setAnswer("boundary", value)} /></div><div className="manual-choice"><span>这次先从哪个入口追问？</span><button className={answers.approach === "object" ? "selected yes" : ""} onClick={() => setAnswer("approach", "object")}>先确认对象</button><button className={answers.approach === "reference" ? "selected yes" : ""} onClick={() => setAnswer("approach", "reference")}>先确认参照</button><button className={answers.approach === "boundary" ? "selected yes" : ""} onClick={() => setAnswer("approach", "boundary")}>先确认边界</button></div><button className="primary" disabled={!answers.approach} onClick={() => setStage("result")}>生成我的反馈追问稿 →</button><Evidence article={article} anchor="question" /></>}</div></section>;
}

function DecisionRun({ article, answers, setAnswer, stage, setStage, step, setStep }: RunnerProps) {
  if (stage === "result") return <ResultView article={article} answers={answers} className="decision-result" />;
  const firstReady = hasText(answers.optionA ?? "") && hasText(answers.optionB ?? "") && answers.reversibility;
  const secondReady = hasText(answers.unknown ?? "") && answers.trial && hasText(answers.deadline ?? "");
  const risk = answers.reversibility === "hard" ? "先验证后再承诺" : answers.reversibility === "mixed" ? "有一项需要先补证据" : "可以低承诺地开始";
  return <section className="solution-board career-board"><aside className="solution-radar career-radar"><span>这次决定的建议</span><strong>{step === 0 ? "先看撤回成本" : risk}</strong><p>不是继续堆优缺点，而是只处理最会改变选择的一条未知信息。</p></aside><div className="solution-work">{step === 0 ? <><div className="eyebrow">第 1 步 · 先看承诺有多重</div><h2>把两个方案写成下一步会发生的动作</h2><div className="demo-form-grid"><Field label="方案 A" value={answers.optionA ?? ""} placeholder="例如：接受新岗位并搬家" onChange={(value) => setAnswer("optionA", value)} /><Field label="方案 B" value={answers.optionB ?? ""} placeholder="例如：留在当前团队三个月" onChange={(value) => setAnswer("optionB", value)} /></div><div className="structured-picks"><span>撤回成本</span><button className={answers.reversibility === "easy" ? "selected" : ""} onClick={() => setAnswer("reversibility", "easy")}>两项都容易撤回</button><button className={answers.reversibility === "mixed" ? "selected" : ""} onClick={() => setAnswer("reversibility", "mixed")}>一项较难撤回</button><button className={answers.reversibility === "hard" ? "selected" : ""} onClick={() => setAnswer("reversibility", "hard")}>两项都难撤回</button></div>{answers.reversibility && <div className="run-inline-feedback"><span>当前建议</span><strong>{risk}</strong></div>}<button className="primary" disabled={!firstReady} onClick={() => setStep(1)}>用一条未知信息验证它 →</button><Evidence article={article} anchor="reversible" /></> : <><div className="eyebrow">第 2 步 · 用最小试验换取证据</div><h2>哪条信息会真正改变你的选择？</h2><div className="demo-form-grid"><Field label="这条关键未知信息" value={answers.unknown ?? ""} placeholder="例如：新岗位是否允许先远程试用" onChange={(value) => setAnswer("unknown", value)} /><Field label="何时结束试验并回看" value={answers.deadline ?? ""} placeholder="例如：本周五下班前" onChange={(value) => setAnswer("deadline", value)} /></div><div className="structured-picks"><span>这轮先用哪个方案做最小试验？</span><button className={answers.trial === "a" ? "selected yes" : ""} onClick={() => setAnswer("trial", "a")}>先试方案 A</button><button className={answers.trial === "b" ? "selected yes" : ""} onClick={() => setAnswer("trial", "b")}>先试方案 B</button></div><button className="primary" disabled={!secondReady} onClick={() => setStage("result")}>生成我的决策边界图 →</button><Evidence article={article} anchor="trial" /></>}</div></section>;
}

function DecisionTrail({ article, answers }: { article: DemoKnowledge; answers: Answers }) {
  const result = buildDemoResultContext(article, answers);
  return <section className="decision-trail" aria-label="本次结果如何形成"><div><span>这次结果是怎么来的</span><strong>{result.selectedPath}</strong></div><div className="decision-trail-rules">{result.rules.map((rule) => <article key={rule.label} className={rule.status}><i>{rule.status === "met" ? "✓" : rule.status === "gap" ? "!" : "→"}</i><div><b>{rule.label}</b><p>{rule.reason}</p></div></article>)}</div></section>;
}

function ResultHeader({ title, subtitle }: { title: string; subtitle: string }) { return <div className="result-head"><div><div className="eyebrow">本次结果</div><h1>{title}</h1><p>{subtitle}</p></div><div className="result-check">✓</div></div>; }
