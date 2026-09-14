"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { demoKnowledge } from "@/src/data/demo-knowledge";

type LocalSession = { id: string; runId: string; status: "created" | "engaged" | "completed" | "abandoned"; progress: Record<string, string>; result?: { headline?: string }; title?: string };
type DemoSession = { runId: string; stage: "form" | "running" | "reflect" | "result"; started: boolean; completed: boolean; savedAt?: string; answers: Record<string, string> };

function hrefFor(runId: string) { return runId.startsWith("fixture_") ? `/play/${runId}` : `/runs/${runId}`; }

export function LocalHistory() {
  const [items, setItems] = useState<LocalSession[]>([]);
  const [demoItems, setDemoItems] = useState<DemoSession[]>([]);
  useEffect(() => {
    const ids = Object.keys(window.localStorage).filter((key) => key.startsWith("zhihu-run-session:")).map((key) => window.localStorage.getItem(key)).filter((id): id is string => Boolean(id));
    Promise.all(ids.map(async (id) => {
      const session = await fetch(`/api/v1/sessions/${id}`).then((response) => response.ok ? response.json() : null);
      if (!session) return null;
      const run = await fetch(`/api/v1/runs/${session.runId}`).then((response) => response.ok ? response.json() : null).catch(() => null);
      return { ...session, title: run?.title } as LocalSession;
    })).then((sessions) => setItems(sessions.filter((item): item is LocalSession => Boolean(item)))).catch(() => undefined);
    try {
      const demos = Object.keys(window.localStorage)
        .filter((key) => key.startsWith("zhihu-run-demo:") && !key.startsWith("zhihu-run-demo-usage:"))
        .map((key) => {
          const runId = key.replace("zhihu-run-demo:", "");
          const saved = JSON.parse(window.localStorage.getItem(key) ?? "{}") as Omit<DemoSession, "runId">;
          return { ...saved, runId } as DemoSession;
        })
        .filter((item) => demoKnowledge.some((article) => article.id === item.runId) && (item.started || Object.keys(item.answers ?? {}).length));
      setDemoItems(demos);
    } catch { setDemoItems([]); }
  }, []);
  if (!items.length && !demoItems.length) return <article className="card"><h2>还没有可继续的运行记录</h2><p>完成或中途离开的 Run 草稿会保留在这个浏览器，刷新后可以继续；运行次数和收藏次数会在服务端统一累计。</p><Link className="primary" href="/">去体验知识程序 →</Link></article>;
  return <div className="grid">{demoItems.sort((a, b) => (b.savedAt ?? "").localeCompare(a.savedAt ?? "")).map((item) => {
    const article = demoKnowledge.find((candidate) => candidate.id === item.runId);
    if (!article) return null;
    return <article className="card" key={item.runId}><div className="meta"><span className="pill">{item.completed ? "已完成" : "可继续"}</span><span className="pill">赛事模拟知识</span></div><h2>{article.title}</h2><p>{item.completed ? "本次结果已保存；可以换一种真实情况再次运行。" : `已记录 ${Object.keys(item.answers ?? {}).length} 项本次情况，可从上次位置继续。`}</p><div style={{ marginTop: 22 }}><Link className="primary" href={`/demo/${item.runId}`}>{item.completed ? "再次用一下 →" : "继续用一下 →"}</Link></div></article>;
  })}{items.sort((a, b) => a.status === "completed" ? -1 : 1).map((item) => <article className="card" key={item.id}><div className="meta"><span className="pill">{item.status === "completed" ? "已完成" : "可继续"}</span></div><h2>{item.title ?? "已发布知识"}</h2><p>{item.result?.headline ?? `已记录 ${Object.keys(item.progress).length} 个步骤。`}</p><div style={{ marginTop: 22 }}><Link className="primary" href={hrefFor(item.runId)}>{item.status === "completed" ? "再次 RUN 一下 →" : "继续 RUN 一下 →"}</Link></div></article>)}</div>;
}
