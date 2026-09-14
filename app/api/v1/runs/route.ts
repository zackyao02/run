import { NextResponse } from "next/server";
import { getPublishedRuns } from "@/src/data/catalog";
import { getRunUsage } from "@/src/domain/runtime";

export async function GET() {
  const publishedRuns = await getPublishedRuns();
  return NextResponse.json({ items: await Promise.all(publishedRuns.map(async ({ components, ...run }) => ({ ...run, usage: await getRunUsage(run.sourceRef.sourceId), componentCount: components.length }))) });
}
