import { NextResponse } from "next/server";
import { compileSource, CompilationError } from "@/src/domain/compilation";
import { myCreatorProvider, CreatorProviderError } from "@/src/domain/my-creator-provider";
import { CompilerModelError } from "@/src/domain/compiler-model";
import { isOperatorRequest } from "@/src/domain/operator-auth";
import { reserveCompilationSlot } from "@/src/domain/operator-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isOperatorRequest(request)) return NextResponse.json({ error: "OPERATOR_AUTH_REQUIRED" }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  const contentUrl = body && typeof body === "object" && typeof (body as Record<string, unknown>).contentUrl === "string" ? (body as Record<string, string>).contentUrl : "";
  if (!contentUrl.trim()) return NextResponse.json({ error: "CONTENT_URL_REQUIRED" }, { status: 400 });
  try {
    const source = await myCreatorProvider.getSource(contentUrl);
    if (!await reserveCompilationSlot()) return NextResponse.json({ error: "COMPILE_RATE_LIMITED" }, { status: 429 });
    const draft = await compileSource(source);
    return NextResponse.json({ id: draft.id, source: { id: draft.source.id, title: draft.source.title, completeness: draft.source.completeness, coverage: draft.source.coverage, provenance: draft.source.provenance }, run: draft.run, createdAt: draft.createdAt }, { status: 201 });
  } catch (error) {
    const code = error instanceof CreatorProviderError || error instanceof CompilationError || error instanceof CompilerModelError ? error.code : "COMPILE_FAILED";
    const status = code === "NOT_EXECUTABLE" ? 422 : code === "CREDENTIALS_MISSING" ? 503 : 400;
    const detail = process.env.NODE_ENV !== "production" && error instanceof Error ? error.message : undefined;
    return NextResponse.json({ error: code, ...(detail ? { detail } : {}) }, { status });
  }
}
