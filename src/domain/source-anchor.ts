import type { ExecutableRun, SourceAnchor, SourceRecord } from "@/src/domain/types";

export function validateSourceAnchor(anchor: SourceAnchor, source: SourceRecord): string | null {
  const block = source.blocks.find((candidate) => candidate.id === anchor.blockId);
  if (!block) return "SOURCE_BLOCK_NOT_FOUND";
  if (block.blockHash !== anchor.blockHash) return "SOURCE_BLOCK_HASH_MISMATCH";
  if (anchor.startOffset < 0 || anchor.endOffset <= anchor.startOffset || anchor.endOffset > block.text.length) return "SOURCE_OFFSET_OUT_OF_RANGE";
  if (block.text.slice(anchor.startOffset, anchor.endOffset) !== anchor.quote) return "SOURCE_QUOTE_OFFSET_MISMATCH";
  return null;
}

export function validateExecutableRun(run: ExecutableRun, source: SourceRecord): string[] {
  const errors: string[] = [];
  if (run.sourceRef.sourceId !== source.id) errors.push("SOURCE_ID_MISMATCH");
  for (const component of run.components) {
    if (!["check", "task", "choice", "warning", "timer"].includes(component.type) || !component.source) continue;
    const error = validateSourceAnchor(component.source, source);
    if (error) errors.push(`${component.id}:${error}`);
  }
  return errors;
}
