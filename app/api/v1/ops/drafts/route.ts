import { NextResponse } from "next/server";
import { isOperatorRequest } from "@/src/domain/operator-auth";
import { listDrafts } from "@/src/domain/operator-store";

export async function GET(request: Request) {
  if (!isOperatorRequest(request)) return NextResponse.json({ error: "OPERATOR_AUTH_REQUIRED" }, { status: 401 });
  return NextResponse.json({ items: (await listDrafts()).map((draft) => ({ id: draft.id, createdAt: draft.createdAt, state: draft.state ?? "draft", approvedRole: draft.approvedRole, source: { id: draft.source.id, title: draft.source.title, completeness: draft.source.completeness, coverage: draft.source.coverage, provenance: draft.source.provenance }, run: draft.run })) });
}
