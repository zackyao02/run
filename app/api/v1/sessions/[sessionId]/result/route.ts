import { NextResponse } from "next/server";
import { getSession } from "@/src/domain/runtime";

export async function GET(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
  if (!session.result) return NextResponse.json({ error: "RESULT_NOT_READY" }, { status: 409 });
  return NextResponse.json(session.result);
}
