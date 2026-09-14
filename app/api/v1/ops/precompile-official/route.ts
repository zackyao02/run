import { NextResponse } from "next/server";
import { isOperatorRequest } from "@/src/domain/operator-auth";
import { precompileOfficialPool } from "@/src/domain/precompiled-official-runs";

export const runtime = "nodejs";

/** Creates deterministic local drafts from the official pool. It never calls a model. */
export async function POST(request: Request) {
  if (!isOperatorRequest(request)) return NextResponse.json({ error: "OPERATOR_AUTH_REQUIRED" }, { status: 401 });
  try {
    const drafts = await precompileOfficialPool();
    return NextResponse.json({ items: drafts.map((draft) => ({ id: draft.id, source: { id: draft.source.id, title: draft.source.title, completeness: draft.source.completeness, coverage: draft.source.coverage, provenance: draft.source.provenance }, run: draft.run, createdAt: draft.createdAt, state: draft.state })), total: drafts.length, compilerCalls: 0 }, { status: 201 });
  } catch (error) {
    const detail = process.env.NODE_ENV !== "production" && error instanceof Error ? error.message : undefined;
    return NextResponse.json({ error: "PRECOMPILE_FAILED", ...(detail ? { detail } : {}) }, { status: 400 });
  }
}
