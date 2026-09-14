import { NextResponse } from "next/server";
import { getPublishedRunBundle } from "@/src/data/catalog";
import { getSession } from "@/src/domain/runtime";
import { reserveRateSlot } from "@/src/domain/persistence";
import { askRuntimeResultAi, RuntimeAiError } from "@/src/domain/runtime-ai";

export const runtime = "nodejs";

function safeFacts(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => typeof item === "string")
    .slice(0, 8)
    .map(([key, item]) => [key.slice(0, 64), (item as string).trim().replace(/[\u0000-\u001f]/g, " ").slice(0, 180)])
    .filter(([, item]) => item));
}

const system = `你是“用一下”的可选 AI 结果整理助手。用户已经完成一条由原文规则驱动的知识 Run。只根据给出的本次路径、结果、用户事实和原文片段，写出一份能马上使用的个性化说明。
不要更改确定性程序的路径、状态或完成结论；不要声称用户事实被文章直接验证；不要编造原文或用户没有提供的细节；不要评价人格、能力或现实成功概率。先解释“用户事实与哪条原文规则相关，所以当前结果是什么”，再给一个具体、低门槛的下一步。
只输出 JSON：{"headline":"不超过70字","interpretation":"不超过320字","nextStep":"不超过180字","reflectionQuestions":["最多两个不超过120字的问题"]}`;

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
  if (!session.result) return NextResponse.json({ error: "RESULT_NOT_READY" }, { status: 409 });
  const bundle = await getPublishedRunBundle(session.runId);
  if (!bundle) return NextResponse.json({ error: "RUN_NOT_FOUND" }, { status: 404 });
  const body = await request.json().catch(() => null);
  const facts = safeFacts(body && typeof body === "object" ? (body as Record<string, unknown>).facts : undefined);
  if (!await reserveRateSlot("runtime-ai-result", 18, 60 * 60 * 1000)) return NextResponse.json({ error: "AI_RESULT_RATE_LIMITED" }, { status: 429 });
  const anchors = session.result.items.map((item) => item.source).filter((item): item is NonNullable<typeof item> => Boolean(item)).slice(0, 5);
  const sourceRules = anchors.map((anchor) => {
    const block = bundle.source.blocks.find((item) => item.id === anchor.blockId);
    return block ? `原文规则：${block.text.slice(0, 500)}` : anchor.quote;
  });
  try {
    const interpretation = await askRuntimeResultAi(system, JSON.stringify({ article: bundle.source.title, userFacts: facts, deterministicResult: session.result, sourceRules }));
    return NextResponse.json({ interpretation });
  } catch (error) {
    const code = error instanceof RuntimeAiError ? error.code : "AI_RESULT_FAILED";
    return NextResponse.json({ error: code }, { status: code === "CREDENTIALS_MISSING" ? 503 : 502 });
  }
}
