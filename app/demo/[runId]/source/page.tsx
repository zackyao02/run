import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoKnowledge } from "@/src/data/demo-knowledge";

export default async function DemoSourcePage({ params, searchParams }: { params: Promise<{ runId: string }>; searchParams: Promise<{ anchor?: string }> }) {
  const [{ runId }, { anchor }] = await Promise.all([params, searchParams]);
  const article = getDemoKnowledge(runId);
  if (!article) notFound();
  return <main className="sim-source-shell"><header className="sim-source-top"><Link href={`/demo/${article.id}`} className="brand">用<span>一下</span></Link><span>赛事模拟知识</span><Link href={`/demo/${article.id}`} className="source-nav-link">返回运行 →</Link></header><article className="sim-article"><div className="sim-article-kicker">模拟知乎知识 · 完整原文</div><h1>{article.title}</h1><div className="sim-author"><div>{article.authorName.slice(0, 1)}</div><span><b>{article.authorName}</b><small>{article.publishedAt} · 赛事模拟内容</small></span></div><p className="sim-intro">{article.summary}</p><div className="sim-article-body">{article.blocks.map((block) => <section className={anchor === block.id ? "source-block source-block-active" : "source-block"} id={block.id} key={block.id}>{block.heading && <h2>{block.heading}</h2>}<p>{block.text}</p>{anchor === block.id && <div className="source-highlight-note">这段原文正在为当前 Run 的规则或结果提供依据。</div>}</section>)}</div><footer>本文为赛事演示构造的完整模拟知识文章，展示“文章 → 规则 → 运行 → 结果”的产品能力。</footer></article></main>;
}
