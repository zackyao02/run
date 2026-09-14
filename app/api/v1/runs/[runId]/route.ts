import { NextResponse } from "next/server";
import { getPublishedRunBundle } from "@/src/data/catalog";
import { getRunUsage } from "@/src/domain/runtime";

export async function GET(_: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  const bundle = await getPublishedRunBundle(runId);
  return bundle
    ? NextResponse.json({ ...bundle.run, sourceTitle: bundle.source.title, sourceAuthorName: bundle.source.authorName, usage: await getRunUsage(runId) })
    : NextResponse.json({ error: "RUN_NOT_FOUND" }, { status: 404 });
}
