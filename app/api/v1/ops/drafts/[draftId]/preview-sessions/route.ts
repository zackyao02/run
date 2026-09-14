import { NextResponse } from "next/server";
import { isOperatorRequest } from "@/src/domain/operator-auth";
import { getDraft } from "@/src/domain/operator-store";
import { createPreviewSession } from "@/src/domain/runtime";

/** Human preview uses the real Runtime but never increments public usage. */
export async function POST(request: Request, context: { params: Promise<{ draftId: string }> }) {
  if (!isOperatorRequest(request)) return NextResponse.json({ error: "OPERATOR_AUTH_REQUIRED" }, { status: 401 });
  const { draftId } = await context.params;
  const draft = await getDraft(draftId);
  if (!draft) return NextResponse.json({ error: "DRAFT_NOT_FOUND" }, { status: 404 });
  return NextResponse.json(await createPreviewSession(draft.run), { status: 201 });
}
