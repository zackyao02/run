import { notFound } from "next/navigation";
import { DemoKnowledgeRunner } from "@/src/components/demo-knowledge-runner";
import { getDemoKnowledge } from "@/src/data/demo-knowledge";

export default async function DemoRunPage({ params, searchParams }: { params: Promise<{ runId: string }>; searchParams: Promise<{ compile?: string }> }) {
  const { runId } = await params;
  const { compile } = await searchParams;
  const article = getDemoKnowledge(runId);
  if (!article) notFound();
  return <DemoKnowledgeRunner article={article} startWithCompile={compile === "1"} />;
}
