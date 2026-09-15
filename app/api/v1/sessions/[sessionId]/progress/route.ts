import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/src/domain/current-account";
import { updateProgress } from "@/src/domain/runtime";
import type { ProgressValue } from "@/src/domain/types";

export async function PATCH(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const body = await request.json() as Record<string, unknown>;
  const allowedKeys = ["componentId", "value"];
  if (Object.keys(body).some((key) => !allowedKeys.includes(key))) return NextResponse.json({ error: "INVALID_PROGRESS_FIELDS" }, { status: 400 });
  const componentId = typeof body.componentId === "string" ? body.componentId : undefined;
  const value = typeof body.value === "string" ? body.value as ProgressValue : undefined;
  if (!componentId || !value || !["normal", "risk", "unchecked", "matched", "not_matched", "needs_review"].includes(value) && !value.startsWith("choice:")) return NextResponse.json({ error: "INVALID_PROGRESS" }, { status: 400 });
  const account = await getCurrentAccount();
  try { return NextResponse.json(await updateProgress(sessionId, componentId, value, account.accountKey)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "PROGRESS_FAILED" }, { status: 404 }); }
}
