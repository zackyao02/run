import "server-only";
import { createHash } from "node:crypto";
import type { NormalizedSource } from "@/src/domain/content-provider";

const API_ORIGIN = "https://developer.zhihu.com";

export interface CreatorContentCandidate {
  url: string;
  title: string;
  contentType: "answer" | "article" | "zvideo" | "pin" | "question";
  createdAt: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
}

export type CreatorProviderErrorCode = "CREATOR_CREDENTIALS_MISSING" | "CREATOR_UPSTREAM_ERROR" | "CREATOR_RESPONSE_INVALID" | "CREATOR_CONTENT_NOT_OWNED" | "CREATOR_BODY_EMPTY";

export class CreatorProviderError extends Error {
  constructor(public readonly code: CreatorProviderErrorCode, message: string) {
    super(message);
    this.name = "CreatorProviderError";
  }
}

function sha256(value: string) { return createHash("sha256").update(value, "utf8").digest("hex"); }
function asRecord(value: unknown): Record<string, unknown> | undefined { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined; }
function integer(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0; }

function htmlToSourceText(value: string) {
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6]|blockquote)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function blocksFor(id: string, body: string) {
  return body.split(/\n{2,}/).map((text) => text.trim()).filter(Boolean).map((text, index) => ({
    id: `${id}-block-${String(index).padStart(3, "0")}`,
    text,
    blockHash: sha256(text),
  }));
}

function canonicalZhihuUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new CreatorProviderError("CREATOR_CONTENT_NOT_OWNED", "content URL is invalid"); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || !(host === "www.zhihu.com" || host === "zhuanlan.zhihu.com")) throw new CreatorProviderError("CREATOR_CONTENT_NOT_OWNED", "content URL must be a public Zhihu URL");
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
  return url.toString();
}

async function requestCreator(path: string, query: Record<string, string>) {
  const secret = process.env.ZHIHU_ACCESS_SECRET?.trim();
  if (!secret) throw new CreatorProviderError("CREATOR_CREDENTIALS_MISSING", "ZHIHU_ACCESS_SECRET is missing");
  const url = new URL(path, API_ORIGIN);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${secret}`, "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)), "Content-Type": "application/json" }, cache: "no-store" });
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new CreatorProviderError("CREATOR_RESPONSE_INVALID", "creator API did not return JSON"); }
  const envelope = asRecord(payload);
  if (!response.ok || envelope?.Code !== 0) throw new CreatorProviderError("CREATOR_UPSTREAM_ERROR", `creator API returned ${String(envelope?.Code ?? response.status)}`);
  const data = asRecord(envelope.Data);
  if (!data) throw new CreatorProviderError("CREATOR_RESPONSE_INVALID", "creator API data is invalid");
  return data;
}

/** Official creator-analysis API; it only ever reads the Access Secret owner's work. */
export class MyCreatorProvider {
  async listContents(limit = 50): Promise<CreatorContentCandidate[]> {
    const data = await requestCreator("/api/v1/user/contents", { ContentType: "all", SortField: "ts", SortOrder: "desc", Offset: "0", Limit: String(Math.max(1, Math.min(limit, 50))) });
    const items = Array.isArray(data.Items) ? data.Items : [];
    const allowed = new Set(["answer", "article", "zvideo", "pin", "question"]);
    return items.flatMap((item): CreatorContentCandidate[] => {
      const record = asRecord(item);
      if (!record) return [];
      const rawUrl = typeof record?.Url === "string" ? record.Url : "";
      const title = typeof record?.Title === "string" ? record.Title.trim() : "";
      const contentType = typeof record?.ContentType === "string" ? record.ContentType : "";
      if (!rawUrl || !title || !allowed.has(contentType)) return [];
      try {
        return [{ url: canonicalZhihuUrl(rawUrl), title, contentType: contentType as CreatorContentCandidate["contentType"], createdAt: integer(record.CreatedAt), likeCount: integer(record.LikeCount), commentCount: integer(record.CommentCount), favoriteCount: integer(record.FavoriteCount) }];
      } catch { return []; }
    });
  }

  async getSource(contentUrl: string): Promise<NormalizedSource> {
    const requestedUrl = canonicalZhihuUrl(contentUrl);
    const data = await requestCreator("/api/v1/user/content_detail", { ContentUrl: requestedUrl });
    const returnedUrl = typeof data.Url === "string" ? canonicalZhihuUrl(data.Url) : "";
    const title = typeof data.Title === "string" ? data.Title.trim() : "";
    const rawBody = typeof data.Body === "string" ? data.Body : "";
    const body = htmlToSourceText(rawBody);
    if (!returnedUrl || returnedUrl !== requestedUrl) throw new CreatorProviderError("CREATOR_CONTENT_NOT_OWNED", "creator API did not confirm the requested content URL");
    if (!title || !body) throw new CreatorProviderError("CREATOR_BODY_EMPTY", "creator API returned no complete body");
    const token = typeof data.ContentToken === "string" && /^[A-Za-z0-9_-]{1,120}$/.test(data.ContentToken) ? data.ContentToken : sha256(returnedUrl).slice(0, 24);
    const id = `creator-${token}`;
    const blocks = blocksFor(id, body);
    if (!blocks.length) throw new CreatorProviderError("CREATOR_BODY_EMPTY", "creator body produced no source blocks");
    return {
      id,
      contentHash: sha256(body),
      title,
      authorName: process.env.ZHIHU_CREATOR_NAME?.trim() || "当前授权知乎账号",
      url: returnedUrl,
      blocks,
      completeness: "full",
      scope: "creator_analysis",
      provenance: "creator_analysis_api",
      contentLength: body.length,
      eligibleForCompiler: true,
      publishingDisclosureRequired: true,
      coverage: { type: "full", startOffset: 0, endOffset: body.length, disclosure: "基于知乎创作分析接口返回的当前授权账号完整正文生成。" },
    };
  }
}

export const myCreatorProvider = new MyCreatorProvider();
