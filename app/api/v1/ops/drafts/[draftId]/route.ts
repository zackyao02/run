import { NextResponse } from "next/server";
import { isOperatorRequest } from "@/src/domain/operator-auth";
import { getDraft } from "@/src/domain/operator-store";

export async function GET(request: Request, context: { params: Promise<{ draftId: string }> }) {
  if (!isOperatorRequest(request)) return NextResponse.json({ error: "OPERATOR_AUTH_REQUIRED" }, { status: 401 });
  const { draftId } = await context.params;
  const draft = await getDraft(draftId);
  return draft ? NextResponse.json(draft) : NextResponse.json({ error: "DRAFT_NOT_FOUND" }, { status: 404 });
}
