import type { SourceRecord } from "@/src/domain/types";

interface Props {
  source: SourceRecord;
  compact?: boolean;
}

export function SourceScopeNotice({ source, compact = false }: Props) {
  const coverage = source.coverage;
  if (!coverage) return null;
  const bounded = coverage.type === "bounded_excerpt";
  const label = bounded ? `官方片段 ${coverage.startOffset}–${coverage.endOffset}` : "完整正文";
  const creatorSource = source.provenance === "creator_analysis_api";
  const detail = bounded
    ? coverage.disclosure ?? `仅基于官方接口返回的 ${coverage.startOffset}–${coverage.endOffset} 字符生成，不代表整篇文章。`
    : creatorSource
      ? coverage.disclosure ?? "本 Run 基于知乎创作分析接口返回的本人完整正文生成。"
      : "本 Run 基于赛事详情接口返回的完整正文生成。";

  return <div className={`source-scope ${bounded ? "bounded" : "full"} ${compact ? "compact" : ""}`} role="note">
    <span className="source-scope-badge">{label}</span>
    {!compact && <span>{detail}</span>}
  </div>;
}
