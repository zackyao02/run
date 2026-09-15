import { NextResponse } from "next/server";
import { createSession } from "@/src/domain/runtime";
import { getPublishedRuns } from "@/src/data/catalog";
import { getCurrentAccount } from "@/src/domain/current-account";

export async function POST(_: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  if (!(await getPublishedRuns()).some((run) => run.sourceRef.sourceId === runId)) {
    return NextResponse.json({ error: "RUN_NOT_FOUND" }, { status: 404 });
  }
  const account = await getCurrentAccount();
  if (!account.authenticated) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  return NextResponse.json(await createSession(runId, undefined, account.accountKey), { status: 201 });
}
