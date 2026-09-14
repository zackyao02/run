import { NextResponse } from "next/server";
import { ContentProviderError, hackathonKnowledgeProvider } from "@/src/domain/content-provider";
import { getOfficialProgramPlan, decisionLabel, programFamilyLabel } from "@/src/domain/official-program-plans";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  try {
    const workId = new URL(request.url).searchParams.get("work_id");
    if (!workId) {
      const candidates = await hackathonKnowledgeProvider.listCandidates();
      return NextResponse.json({
        candidates,
        count: candidates.length,
        programPlans: candidates.map((candidate) => {
          const plan = getOfficialProgramPlan(candidate.workId);
          return plan ? { ...plan, familyLabel: programFamilyLabel[plan.family], decisionLabel: decisionLabel[plan.decision], title: candidate.title } : { workId: candidate.workId, title: candidate.title, decision: "hold", decisionLabel: "暂不制作", familyLabel: "未分类", experience: "待评估", goal: "待评估", reason: "未配置文章策划方案。" };
        }),
      });
    }
    const source = await hackathonKnowledgeProvider.getSource(workId);
    return NextResponse.json({ source });
  } catch (error) {
    const code = error instanceof ContentProviderError ? error.code : "UPSTREAM_ERROR";
    const message = error instanceof Error ? error.message : "provider request failed";
    const status = code === "WORK_ID_NOT_FROM_LIST" ? 400 : code === "SOURCE_EMPTY" || code === "INVALID_RESPONSE" ? 422 : 502;
    return NextResponse.json({ error: code, message }, { status });
  }
}
