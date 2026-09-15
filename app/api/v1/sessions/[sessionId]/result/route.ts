import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/src/domain/current-account";
import { getSessionForAccount } from "@/src/domain/runtime";

export async function GET(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const account = await getCurrentAccount();
  const session = await getSessionForAccount(sessionId, account.accountKey);
  if (!session) return NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
  if (!session.result) return NextResponse.json({ error: "RESULT_NOT_READY" }, { status: 409 });
  return NextResponse.json(session.result);
}
