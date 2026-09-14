import { NextResponse } from "next/server";
import { getSession } from "@/src/domain/runtime";

export async function GET(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const session = await getSession(sessionId);
  return session ? NextResponse.json(session) : NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
}
