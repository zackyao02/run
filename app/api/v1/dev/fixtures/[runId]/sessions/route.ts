import { NextResponse } from "next/server";
import { fixtureRuns } from "@/src/data/fixture";
import { createFixtureSession, getRunUsage } from "@/src/domain/runtime";

export async function GET(_: Request, context: { params: Promise<{ runId: string }> }) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const { runId } = await context.params;
  const run = fixtureRuns.find((item) => item.sourceRef.sourceId === runId);
  if (!run) return NextResponse.json({ error: "RUN_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ runId, usage: await getRunUsage(runId) });
}

export async function POST(_: Request, context: { params: Promise<{ runId: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const { runId } = await context.params;
  const run = fixtureRuns.find((item) => item.sourceRef.sourceId === runId);
  if (!run) {
    return NextResponse.json({ error: "RUN_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json(await createFixtureSession(run), { status: 201 });
}
