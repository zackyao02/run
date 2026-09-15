import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/src/domain/current-account";
import { getSessionForAccount } from "@/src/domain/runtime";

export async function GET(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const account = await getCurrentAccount();
  const session = await getSessionForAccount(sessionId, account.accountKey);
  return session ? NextResponse.json(session) : NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
}
