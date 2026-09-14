import { NextResponse } from "next/server";
import { createSession } from "@/src/domain/runtime";
import { getPublishedRuns } from "@/src/data/catalog";

export async function POST(_: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  if (!(await getPublishedRuns()).some((run) => run.sourceRef.sourceId === runId)) {
    return NextResponse.json({ error: "RUN_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json(await createSession(runId), { status: 201 });
}
