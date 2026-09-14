import { NextResponse } from "next/server";
import { compileOfficialSource, CompilationError } from "@/src/domain/compilation";
import { isOperatorRequest } from "@/src/domain/operator-auth";
import { reserveCompilationSlot } from "@/src/domain/operator-store";
import { CompilerModelError } from "@/src/domain/compiler-model";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isOperatorRequest(request)) return NextResponse.json({ error: "OPERATOR_AUTH_REQUIRED" }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  const workId = body && typeof body === "object" && typeof (body as Record<string, unknown>).workId === "string" ? (body as Record<string, string>).workId.trim() : "";
  if (!workId) return NextResponse.json({ error: "WORK_ID_REQUIRED" }, { status: 400 });
  // Invalid local/UI requests must not spend a protected model rate slot.
  if (!await reserveCompilationSlot()) return NextResponse.json({ error: "COMPILE_RATE_LIMITED" }, { status: 429 });
  try {
    const draft = await compileOfficialSource(workId);
    return NextResponse.json({ id: draft.id, source: { id: draft.source.id, title: draft.source.title, completeness: draft.source.completeness, coverage: draft.source.coverage, provenance: draft.source.provenance }, run: draft.run, createdAt: draft.createdAt }, { status: 201 });
  } catch (error) {
    const code = error instanceof CompilationError || error instanceof CompilerModelError ? error.code : "COMPILE_FAILED";
    const status = code === "NOT_EXECUTABLE" ? 422 : code === "CREDENTIALS_MISSING" ? 503 : 400;
    const detail = process.env.NODE_ENV !== "production" && (error instanceof CompilationError || error instanceof CompilerModelError) ? error.message : undefined;
    return NextResponse.json({ error: code, ...(detail ? { detail } : {}) }, { status });
  }
}
