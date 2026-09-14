import Link from "next/link";
import { listPublishedRunBundles } from "@/src/data/catalog";
import { getRunUsage } from "@/src/domain/runtime";
import { SourceScopeNotice } from "@/src/components/source-scope-notice";
import { demoKnowledge } from "@/src/data/demo-knowledge";
import { DemoUsageStats } from "@/src/components/demo-usage-stats";
import { HomeRefresh } from "@/src/components/home-refresh";
import { FavoriteButton } from "@/src/components/favorite-button";
import { ZhihuAuthCard } from "@/src/components/zhihu-auth-card";

// Usage is read from the live persistence layer; returning to the homepage
// after a completed Run must not show a cached number.
export const dynamic = "force-dynamic";

function promiseFor(description: string) { return description.length > 112 ? `${description.slice(0, 109)}…` : description; }

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const keyword = q.trim().toLocaleLowerCase();
  const all = await Promise.all((await listPublishedRunBundles()).map(async (bundle) => ({ ...bundle, usage: await getRunUsage(bundle.run.sourceRef.sourceId) })));
  const entries = all.filter(({ run, source }) => !keyword || [run.title, run.description, source.authorName, run.category].filter(Boolean).join(" ").toLocaleLowerCase().includes(keyword));
  const demoEntries = demoKnowledge.filter((article) => !keyword || [article.title, article.summary, article.promise, article.authorName].join(" ").toLocaleLowerCase().includes(keyword));
  const hero = entries.find((entry) => entry.role === "hero");
  const cards = entries.filter((entry) => entry !== hero);
  const publishedIndex = new Map(all.map((entry, index) => [entry.run.sourceRef.sourceId, index + 1]));
  const demoOffset = all.length;
  return <main className="shell discovery-shell"><HomeRefresh />
    <header className="topbar discovery-topbar"><Link href="/" className="brand">用<span>一下</span></Link><nav className="home-nav"><a href="#knowledge">发现知识</a><Link href="/me">我的运行</Link></nav></header>
    <div className="container discovery-container">
      <section className="discovery-hero"><div><div className="eyebrow">知乎知识，正在变成行动</div><h1>读过的知识，<br /><em>现在就用一下。</em></h1><p className="lede">把知乎里的方法、判断和经验，变成一次能操作、能留下结果、能回看原文的运行。</p></div><div className="hero-orbit" aria-hidden="true"><div className="orbit-planet-track planet-track-source"><i /></div><div className="orbit-planet-track planet-track-choice"><i /></div><div className="orbit-planet-track planet-track-result"><i /></div><span className="orbit-source">原文</span><span className="orbit-choice">判断</span><span className="orbit-result">结果</span><strong>RUN</strong><img className="kanshan-hero-mascot" src="/mascot/liu-kanshan-wave.gif" alt="刘看山动态形象" /></div></section>
      <form className="run-search" action="/" role="search"><label htmlFor="q">搜索已发布知识</label><div><input id="q" name="q" defaultValue={q} placeholder="按标题、作者或主题搜索" /><button className="secondary" type="submit">搜索</button></div></form>
      <section id="zhihu-login" className="auth-entry" aria-label="知乎账号登录"><ZhihuAuthCard /></section>
      <section id="knowledge" className="published-section official-published-section"><div className="section-title"><div><div className="eyebrow">已发布知乎知识</div><h2>从真实知识开始用一下</h2></div><p>这些文章已由系统根据原文规则自动编译成可运行程序；每一篇都经过来源、原文锚点与人工发布确认。</p></div>
        {hero && <RunCard entry={hero} hero index={publishedIndex.get(hero.run.sourceRef.sourceId) ?? 1} />}{cards.length > 0 && <div className="published-grid">{cards.map((entry) => <RunCard entry={entry} index={publishedIndex.get(entry.run.sourceRef.sourceId) ?? 1} key={entry.run.sourceRef.sourceId} />)}{cards.length % 2 === 1 && <MoreKnowledgePlaceholder />}</div>}
        {!entries.length && <section className="empty-published"><div className="empty-orbit">⌁</div><h2>{keyword ? "没有找到匹配的真实知乎 Run" : "真实赛事知识正在人工核验"}</h2><p>{keyword ? "试试文章标题、作者名或更短的关键词。" : "上方的赛事模拟知识用于完整展示产品能力；真实知乎内容会在通过来源、锚点和人工发布后出现在这里。"}</p></section>}
      </section>
      <section className="published-section demo-published-section"><div className="section-title"><div><div className="eyebrow">更多可体验场景</div><h2>把一件真实小事先用起来</h2></div><p>这是赛事模拟知识，用于完整展示不同文章如何变成路径、判断和可带走的行动结果。</p></div>
        <div className="demo-knowledge-grid">{demoEntries.map((article) => <DemoCard article={article} index={demoOffset + demoKnowledge.findIndex((item) => item.id === article.id) + 1} featured={demoKnowledge.findIndex((item) => item.id === article.id) === 0} key={article.id} />)}</div>
        {!demoEntries.length && <p className="demo-search-empty">没有找到匹配的体验场景，试试“租房”“会议”“反馈”或“决策”。</p>}
      </section>
      <section className="discovery-principles" aria-labelledby="principles-title"><div className="principles-heading"><div><span className="principles-kicker">RUN ENGINE · CORE LOGIC</span><h2 id="principles-title">不是读完就算，<em>是把知识跑一遍。</em></h2></div><p>每篇文章都会被拆成可验证的规则、路径和结果物。用户看到的不是一张任务清单，而是一台把原文变成行动的运行引擎。</p></div><div className="principles-flow"><article className="principle-card principle-source"><div className="principle-visual"><span>01</span><b>SOURCE</b></div><div className="principle-copy"><span>原文 → 规则</span><strong>文章决定怎么运行</strong><p>系统只读取文章中明确存在的条件、动作与反馈，原文决定路径，不靠猜。</p><small>规则由原文锁定</small></div></article><article className="principle-card principle-state"><div className="principle-visual"><span>02</span><b>STATE</b></div><div className="principle-copy"><span>操作 → 状态</span><strong>每次操作都会产生变化</strong><p>一个选择就会迁移状态、打开分支或留下实验记录，让知识真正发生在你身上。</p><small>路径正在实时迁移</small></div></article><article className="principle-card principle-result"><div className="principle-visual"><span>03</span><b>RESULT</b></div><div className="principle-copy"><span>结果 → 证据</span><strong>每一步都能回到原文</strong><p>完成后带走的是你的运行轨迹与可用结果，每个判断都能定位对应的原文段落。</p><small>结果可回看、可复盘</small></div></article></div><div className="principles-footer"><span>RUN ENGINE STATUS</span><strong>原文已连接</strong><i /><strong>路径可运行</strong><i /><strong>结果可回看</strong></div></section>
    </div>
  </main>;
}

function MoreKnowledgePlaceholder() {
  return <article className="published-placeholder-card"><div className="placeholder-orbit" aria-hidden="true">＋</div><div><div className="eyebrow">更多知识即将开放</div><h3>敬请期待知乎更多文章权限</h3><p>开放更多授权后，这里会继续自动编译新的知乎知识 Run。</p></div><span className="placeholder-status">权限开放中</span></article>;
}

function DemoCard({ article, index, featured }: { article: typeof demoKnowledge[number]; index: number; featured: boolean }) {
  const bring = article.kind === "rental" ? "一套正在考虑的房子和你的真实通勤边界" : article.kind === "meeting" ? "一次开完却没有结论的真实会议" : article.kind === "feedback" ? "一句让你不知道该怎么改的真实反馈" : "两个正在犹豫的真实方案";
  return <article className={`demo-knowledge-card ${featured ? "demo-featured" : ""} accent-${article.accent}`}><div className="demo-card-index">{String(index).padStart(2, "0")}</div><div className="card-kicker"><span>赛事模拟知识</span><span>{article.estimatedMinutes} 分钟 · {article.blocks.length} 段原文</span></div><h3>{article.title}</h3><p className="run-author">{article.authorName} · 体验知识</p><p className="demo-card-task"><b>带着：</b>{bring}</p><p className="run-promise"><b>你会拿走：</b>{article.promise}</p><div className="demo-card-meta"><DemoUsageStats articleId={article.id} /><FavoriteButton runId={article.id} /></div><div className="demo-card-actions"><Link className="secondary-link" href={`/demo/${article.id}/source`}>阅读原文</Link><Link className="primary" href={`/demo/${article.id}?compile=1`}>RUN 一下 →</Link></div></article>;
}

type Entry = Awaited<ReturnType<typeof listPublishedRunBundles>>[number] & { usage: { started: number; completed: number } };
function RunCard({ entry, hero = false, index }: { entry: Entry; hero?: boolean; index: number }) {
  const { run, source, usage } = entry;
  const nodes = run.components.filter((component) => ["check", "task", "choice", "timer", "input"].includes(component.type)).length;
  return <article className={`published-card published-unified-card ${hero ? "hero-run-card" : ""}`}><div className="demo-card-index">{String(index).padStart(2, "0")}</div><div className="published-card-main"><div className="card-kicker"><span>{hero ? "本期推荐" : "已发布"}</span><span>{run.estimatedMinutes ?? 3} 分钟 · {nodes} 个关键节点</span></div><h3>{run.title}</h3><p className="run-author">{source.authorName} · 知乎知识</p><p className="run-promise">{promiseFor(run.description)}</p><SourceScopeNotice source={source} compact /><div className="demo-card-meta"><div className="run-stats">{usage.started > 0 ? <><span>▶ {usage.started} 次运行</span><span>✓ {usage.completed} 次完成</span>{usage.started >= 10 && <span>{Math.round((usage.completed / usage.started) * 100)}% 完成</span>}</> : <span>首批体验 · 你的运行会成为第一条记录</span>}</div><FavoriteButton runId={run.sourceRef.sourceId} /></div></div><div className="published-card-action"><Link className="secondary-link" href={`/knowledge/${run.sourceRef.sourceId}`}>了解这篇知识</Link><Link className="primary" href={`/runs/${run.sourceRef.sourceId}`}>RUN 一下 →</Link></div></article>;
}
