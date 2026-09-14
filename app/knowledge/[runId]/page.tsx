import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedRunBundle } from "@/src/data/catalog";
import { getRunUsage } from "@/src/domain/runtime";
import { SourceScopeNotice } from "@/src/components/source-scope-notice";

export default async function KnowledgeDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const bundle = await getPublishedRunBundle(runId);
  if (!bundle) notFound();
  const { run, source } = bundle;
  const usage = await getRunUsage(runId);
  const actions = run.components.filter((item) => ["check", "task", "choice", "timer", "input"].includes(item.type));
  return <main className="shell detail-shell"><header className="topbar"><Link className="brand" href="/">用<span>一下</span></Link><Link className="nav-note" href="/me">我的运行</Link></header><div className="container detail-container">
    <Link href="/" className="back-link">← 返回已发布知识</Link>
    <section className="detail-hero"><div><div className="eyebrow">这篇知识已生成可运行路径</div><h1>{run.title}</h1><p className="detail-author">{source.authorName} · 知乎知识</p><p className="lede">{run.description}</p><SourceScopeNotice source={source} /><div className="detail-stats"><span>约 {run.estimatedMinutes ?? 3} 分钟</span><span>{actions.length} 个关键节点</span><span>▶ {usage.started} 次运行</span><span>✓ {usage.completed} 次完成</span></div><Link className="primary detail-launch" href={`/runs/${runId}`}>RUN一下 →</Link></div><aside className="detail-flow"><small>本次运行会</small><ol><li>从一个具体事件开始</li><li>按你的操作迁移状态或路径</li><li>在每个关键节点查看原文依据</li><li>留下本次运行结果</li></ol></aside></section>
    <section className="detail-evidence"><div><div className="eyebrow">每一步都能回到原文</div><h2>不是再总结一次文章。</h2><p>这条 Run 只回放已确认的来源规则。没有原文支持的动作、分支或结论，不会出现在运行里。</p></div><div className="evidence-list">{actions.slice(0, 4).map((action, index) => <article key={action.id}><span>0{index + 1}</span><div><strong>{action.title ?? "关键节点"}</strong><p>{action.source?.quote ?? "已验证来源锚点"}</p></div></article>)}</div></section>
  </div></main>;
}
