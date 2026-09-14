import type { ExecutableRun, SourceRecord } from "@/src/domain/types";
import { getPublishedDocument, listPublishedDocuments, savePublishedDocument } from "@/src/domain/persistence";

export interface PublishedRunBundle {
  run: ExecutableRun;
  source: SourceRecord;
  role: "hero" | "supporting";
}

/** Published content is read from Postgres when DATABASE_URL is configured. */
export async function listPublishedRunBundles(): Promise<PublishedRunBundle[]> {
  return listPublishedDocuments();
}

export async function getPublishedRuns(): Promise<ExecutableRun[]> {
  return (await listPublishedRunBundles()).map((bundle) => bundle.run);
}

export async function publishRunBundle(bundle: PublishedRunBundle): Promise<void> {
  await savePublishedDocument(bundle);
}

export async function getPublishedRunBundle(runId: string): Promise<PublishedRunBundle | undefined> {
  return getPublishedDocument(runId);
}
