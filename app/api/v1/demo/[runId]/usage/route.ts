import { NextResponse } from "next/server";
import { getUsageDocument, incrementUsageDocument } from "@/src/domain/persistence";

export async function GET(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  return NextResponse.json({ usage: await getUsageDocument(runId) });
}

export async function POST(request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const field = body?.field === "completed" ? "completed" : body?.field === "started" ? "started" : undefined;
  if (!field) return NextResponse.json({ error: "INVALID_USAGE_FIELD" }, { status: 400 });
  await incrementUsageDocument(runId, field);
  return NextResponse.json({ usage: await getUsageDocument(runId) }, { status: 201 });
}
