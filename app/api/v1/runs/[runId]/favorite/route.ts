import { NextResponse } from "next/server";
import { getFavoriteDocument, incrementFavoriteDocument } from "@/src/domain/persistence";

export async function GET(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  return NextResponse.json({ favorites: await getFavoriteDocument(runId) });
}

export async function POST(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  return NextResponse.json({ favorites: await incrementFavoriteDocument(runId) }, { status: 201 });
}
