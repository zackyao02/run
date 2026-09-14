import { NextResponse } from "next/server";
import { completeSession } from "@/src/domain/runtime";

export async function POST(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  try {
    return NextResponse.json(await completeSession(sessionId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "COMPLETION_FAILED" }, { status: 409 });
  }
}
