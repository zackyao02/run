import "server-only";
import type { NormalizedSource } from "@/src/domain/content-provider";
import type { ExecutableRun } from "@/src/domain/types";
import { getDraftDocument, listDraftDocuments, saveDraftDocument } from "@/src/domain/persistence";
import { reserveRateSlot } from "@/src/domain/persistence";

export interface CompilationDraft {
  id: string;
  source: NormalizedSource;
  run: ExecutableRun;
  createdAt: string;
  judge: unknown;
  planner: unknown;
  semanticValidation: unknown;
  state?: "draft" | "ready" | "published";
  approvedRole?: "hero" | "supporting";
}

export function reserveCompilationSlot(): Promise<boolean> {
  // Local development is intentionally repeatable: stale in-memory test
  // events must not block a developer from re-running a draft. The limit is
  // retained for every deployed instance where the protected endpoint is
  // reachable outside loopback.
  if (process.env.NODE_ENV !== "production") return Promise.resolve(true);
  return reserveRateSlot("compile", 6, 60 * 60 * 1000);
}

export async function saveDraft(draft: CompilationDraft): Promise<void> { await saveDraftDocument(draft); }
export async function getDraft(id: string): Promise<CompilationDraft | undefined> { return getDraftDocument(id); }
export async function listDrafts(): Promise<CompilationDraft[]> { return listDraftDocuments(); }
