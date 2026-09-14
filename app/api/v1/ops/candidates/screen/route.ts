import { NextResponse } from "next/server";
import { CandidateScreeningError, screenOfficialCandidates } from "@/src/domain/candidate-screening";
import { CompilerModelError } from "@/src/domain/compiler-model";
import { isOperatorRequest } from "@/src/domain/operator-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isOperatorRequest(request)) return NextResponse.json({ error: "OPERATOR_AUTH_REQUIRED" }, { status: 401 });
  try {
    const result = await screenOfficialCandidates();
    return NextResponse.json(result);
  } catch (error) {
    const code = error instanceof CandidateScreeningError || error instanceof CompilerModelError ? error.code : "SCREENING_FAILED";
    const status = code === "SCREENING_RATE_LIMITED" ? 429 : code === "CREDENTIALS_MISSING" ? 503 : 400;
    const detail = process.env.NODE_ENV !== "production" && error instanceof Error ? error.message : undefined;
    return NextResponse.json({ error: code, ...(detail ? { detail } : {}) }, { status });
  }
}
