import { createHash } from "node:crypto";
import type { SourceRecord } from "@/src/domain/types";

const DEFAULT_BASE_URL = "https://api.zhihu.com/km-indep-home/hackathon/v2";
const ALLOWED_ORIGIN = "https://api.zhihu.com";
export const MAX_FULL_SOURCE_CHARS = 3000;

export interface ContentCandidate {
  workId: string;
  title: string;
  description?: string;
  artwork?: string;
  tabArtwork?: string;
  labels: string[];
}

export interface NormalizedSource extends SourceRecord {
  contentHash: string;
  completeness: "full" | "bounded_excerpt";
  scope: "hackathon_event" | "creator_analysis";
  contentLength: number;
  eligibleForCompiler: true;
  publishingDisclosureRequired: boolean;
}


export type ProviderErrorCode = "UPSTREAM_ERROR" | "INVALID_RESPONSE" | "SOURCE_EMPTY" | "WORK_ID_NOT_FROM_LIST";

export class ContentProviderError extends Error {
  constructor(public readonly code: ProviderErrorCode, message: string) {
    super(message);
    this.name = "ContentProviderError";
  }
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizeBody(value: string) {
  return value.replace(/\r\n?/g, "\n").trim();
}

function segmentSource(workId: string, body: string) {
  return body.split(/\n{2,}/).map((text, index) => text.trim()).filter(Boolean).map((text, index) => ({
    id: `${workId}-block-${String(index).padStart(3, "0")}`,
    text,
    blockHash: sha256(text),
  }));
}

export class HackathonKnowledgeProvider {
  private readonly baseUrl: string;
  private candidateIds = new Set<string>();

  constructor(baseUrl = process.env.ZHIHU_HACKATHON_API_BASE ?? DEFAULT_BASE_URL) {
    const parsed = new URL(baseUrl);
    if (parsed.origin !== ALLOWED_ORIGIN || parsed.pathname.replace(/\/$/, "") !== "/km-indep-home/hackathon/v2") {
      throw new Error("HackathonKnowledgeProvider base URL must be the official Zhihu hackathon API");
    }
    this.baseUrl = parsed.toString().replace(/\/$/, "");
  }

  async listCandidates(): Promise<ContentCandidate[]> {
    const response = await fetch(`${this.baseUrl}/knowledge/list`, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new ContentProviderError("UPSTREAM_ERROR", `knowledge list returned HTTP ${response.status}`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new ContentProviderError("INVALID_RESPONSE", "knowledge list must be a top-level array");
    const candidates = payload.flatMap((item): ContentCandidate[] => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const workId = typeof record.work_id === "string" ? record.work_id : "";
      const title = typeof record.title === "string" ? record.title : "";
      if (!workId || !title || /[\\/?#\r\n]/.test(workId)) return [];
      return [{ workId, title, description: typeof record.description === "string" ? record.description : undefined, artwork: typeof record.artwork === "string" ? record.artwork : undefined, tabArtwork: typeof record.tab_artwork === "string" ? record.tab_artwork : undefined, labels: Array.isArray(record.labels) ? record.labels.filter((label): label is string => typeof label === "string") : [] }];
    });
    this.candidateIds = new Set(candidates.map((candidate) => candidate.workId));
    return candidates;
  }

  async getSource(workId: string): Promise<NormalizedSource> {
    if (!workId || /[\\/?#\r\n]/.test(workId)) throw new ContentProviderError("WORK_ID_NOT_FROM_LIST", "work_id is invalid");
    if (!this.candidateIds.has(workId)) await this.listCandidates();
    if (!this.candidateIds.has(workId)) throw new ContentProviderError("WORK_ID_NOT_FROM_LIST", "work_id did not come from the current knowledge list");
    const response = await fetch(`${this.baseUrl}/knowledge/${encodeURIComponent(workId)}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new ContentProviderError("UPSTREAM_ERROR", `knowledge detail returned HTTP ${response.status}`);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object") throw new ContentProviderError("INVALID_RESPONSE", "knowledge detail must be an object");
    const record = payload as Record<string, unknown>;
    const body = typeof record.content === "string" ? normalizeBody(record.content) : "";
    if (!body) throw new ContentProviderError("SOURCE_EMPTY", "knowledge detail content is empty");
    const title = typeof record.chapter_name === "string" && record.chapter_name ? record.chapter_name : "";
    const authorName = typeof record.author_name === "string" ? record.author_name.trim() : "";
    if (!title || !authorName) throw new ContentProviderError("INVALID_RESPONSE", "knowledge detail must include chapter_name and author_name");
    const blocks = segmentSource(workId, body);
    if (!blocks.length) throw new ContentProviderError("SOURCE_EMPTY", "knowledge detail produced no source blocks");
    const bounded = body.length >= MAX_FULL_SOURCE_CHARS;
    return {
      id: workId,
      contentHash: sha256(body),
      title,
      authorName,
      // Hackathon knowledge objects are not public zhihu.com article pages.
      // Keep the official detail endpoint as the verifiable source link.
      url: `${this.baseUrl}/knowledge/${encodeURIComponent(workId)}`,
      blocks,
      completeness: bounded ? "bounded_excerpt" : "full",
      scope: "hackathon_event",
      provenance: "hackathon_event_api",
      contentLength: body.length,
      eligibleForCompiler: true,
      publishingDisclosureRequired: bounded,
      coverage: {
        type: bounded ? "bounded_excerpt" : "full",
        startOffset: 0,
        endOffset: body.length,
        providerLimit: bounded ? MAX_FULL_SOURCE_CHARS : undefined,
        disclosure: bounded ? `基于知乎赛事官方接口提供的前 ${body.length} 字符生成，不代表整篇文章。` : undefined,
      },
    };
  }

  /** @deprecated Prefer getSource so callers do not assume every response is a full article. */
  async getFullContent(workId: string): Promise<NormalizedSource> {
    return this.getSource(workId);
  }
}

export const hackathonKnowledgeProvider = new HackathonKnowledgeProvider();
