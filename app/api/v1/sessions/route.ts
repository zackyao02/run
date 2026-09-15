import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/src/domain/current-account";
import { persistenceMode } from "@/src/domain/persistence";
import { listSessionsForAccount } from "@/src/domain/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getCurrentAccount();
  const headers = { "Cache-Control": "no-store" };
  if (!account.authenticated || !account.accountKey) {
    return NextResponse.json({ authenticated: Boolean(account.authenticated), persistent: persistenceMode() === "postgres", items: [] }, { headers });
  }
  const items = (await listSessionsForAccount(account.accountKey)).map(({ id, runId, status, progress, result }) => ({ id, runId, status, progress, result }));
  return NextResponse.json({ authenticated: true, persistent: persistenceMode() === "postgres", items }, { headers });
}
