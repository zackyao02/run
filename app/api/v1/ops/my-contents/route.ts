import { NextResponse } from "next/server";
import { myCreatorProvider, CreatorProviderError } from "@/src/domain/my-creator-provider";
import { isOperatorRequest } from "@/src/domain/operator-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isOperatorRequest(request)) return NextResponse.json({ error: "OPERATOR_AUTH_REQUIRED" }, { status: 401 });
  try { return NextResponse.json({ items: await myCreatorProvider.listContents() }); }
  catch (error) {
    const code = error instanceof CreatorProviderError ? error.code : "CREATOR_LIST_FAILED";
    const detail = process.env.NODE_ENV !== "production" && error instanceof Error ? error.message : undefined;
    return NextResponse.json({ error: code, ...(detail ? { detail } : {}) }, { status: 400 });
  }
}
