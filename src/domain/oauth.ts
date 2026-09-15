import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const OAUTH_STATE_COOKIE = "zhihu_oauth_state";
export const OAUTH_SESSION_COOKIE = "zhihu_oauth_session";
export const OAUTH_IDENTITY_COOKIE = "zhihu_oauth_identity";
const STATE_TTL_MS = 10 * 60 * 1000;

export interface ZhihuUserProfile {
  id?: string;
  urlToken?: string;
  name?: string;
  avatarUrl?: string;
  headline?: string;
}

interface PendingState { createdAt: number; returnTo: string; }
interface OAuthSession { accessToken: string; expiresAt: number; profile: ZhihuUserProfile | null; }

const pendingStates = new Map<string, PendingState>();
const sessions = new Map<string, OAuthSession>();

function prune() {
  const now = Date.now();
  for (const [state, value] of pendingStates) if (now - value.createdAt > STATE_TTL_MS) pendingStates.delete(state);
  for (const [id, session] of sessions) if (session.expiresAt <= now) sessions.delete(id);
}

function isLocalHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.startsWith("192.168.") || host.startsWith("10.");
}

export function getOAuthConfig() {
  const appId = process.env.ZHIHU_OAUTH_APP_ID?.trim();
  const appKey = process.env.ZHIHU_OAUTH_APP_KEY?.trim();
  const redirectUri = process.env.ZHIHU_OAUTH_REDIRECT_URI?.trim();
  return { appId, appKey, redirectUri };
}

export function assertPublicRedirectUri(value: string | undefined) {
  if (!value) throw new Error("OAUTH_REDIRECT_URI_NOT_CONFIGURED");
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" || isLocalHost(parsed.hostname) || !parsed.pathname.endsWith("/auth/callback")) {
    throw new Error("OAUTH_REDIRECT_URI_MUST_BE_PUBLIC_HTTPS");
  }
  return parsed.toString();
}

export function normalizeReturnTo(value: string | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const parsed = new URL(value, "https://return.invalid");
    if (parsed.pathname.startsWith("/api/auth") || parsed.pathname === "/auth/callback") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback;
  } catch {
    return fallback;
  }
}

export function createPendingState(returnTo = "/") {
  prune();
  const state = randomBytes(32).toString("hex");
  pendingStates.set(state, { createdAt: Date.now(), returnTo: normalizeReturnTo(returnTo) });
  return state;
}

/**
 * A signed short-lived state cookie lets the callback survive a CloudBase
 * container switch. Only the random state and an internal return path are
 * stored; no Zhihu credential is included.
 */
export function createPendingStateCookieValue(state: string, returnTo = "/") {
  const secret = identitySecret();
  if (!secret) return undefined;
  const payload = Buffer.from(JSON.stringify({ state, createdAt: Date.now(), returnTo: normalizeReturnTo(returnTo) }), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readPendingStateCookie(value: string | undefined) {
  const secret = identitySecret();
  if (!secret || !value) return undefined;
  const [payload, encodedSignature] = value.split(".");
  if (!payload || !encodedSignature) return undefined;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const actual = Buffer.from(encodedSignature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { state?: string; createdAt?: number; returnTo?: string };
    if (!parsed.state || !Number.isFinite(parsed.createdAt) || parsed.createdAt === undefined || Date.now() - parsed.createdAt > STATE_TTL_MS) return undefined;
    return { state: parsed.state, createdAt: parsed.createdAt, returnTo: normalizeReturnTo(parsed.returnTo) };
  } catch { return undefined; }
}

export function consumePendingState(state: string, expectedCookie: string | undefined) {
  prune();
  if (!state || !expectedCookie) return undefined;
  const signed = readPendingStateCookie(expectedCookie);
  if (signed) {
    const a = Buffer.from(state);
    const b = Buffer.from(signed.state);
    if (a.length === b.length && timingSafeEqual(a, b)) return { createdAt: signed.createdAt, returnTo: signed.returnTo };
    return undefined;
  }
  const a = Buffer.from(state);
  const b = Buffer.from(expectedCookie);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;
  const pending = pendingStates.get(state);
  if (!pending || Date.now() - pending.createdAt > STATE_TTL_MS) return undefined;
  pendingStates.delete(state);
  return pending;
}

export function createSession(accessToken: string, expiresIn: number, profile: ZhihuUserProfile | null) {
  prune();
  const id = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + Math.max(60, Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000;
  sessions.set(id, { accessToken, expiresAt, profile });
  return { id, expiresAt };
}

function identitySecret() { return process.env.ZHIHU_OAUTH_APP_KEY?.trim() ?? ""; }

export function createIdentityCookieValue(profile: ZhihuUserProfile | null, expiresAt: number) {
  const secret = identitySecret();
  if (!secret) return undefined;
  const payload = Buffer.from(JSON.stringify({ profile, expiresAt }), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readIdentityCookie(value: string | undefined) {
  const secret = identitySecret();
  if (!secret || !value) return undefined;
  const [payload, encodedSignature] = value.split(".");
  if (!payload || !encodedSignature) return undefined;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const actual = Buffer.from(encodedSignature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { profile?: ZhihuUserProfile | null; expiresAt?: number };
    const expiresAt = parsed.expiresAt;
    if (!Number.isFinite(expiresAt) || expiresAt === undefined || expiresAt <= Date.now()) return undefined;
    return { accessToken: "", expiresAt, profile: parsed.profile ?? null } satisfies OAuthSession;
  } catch { return undefined; }
}

export function getSession(id: string | undefined, identityCookie?: string) {
  if (!id) return readIdentityCookie(identityCookie);
  prune();
  return sessions.get(id) ?? readIdentityCookie(identityCookie);
}

/**
 * Store only a stable pseudonym with a Run session.  The Zhihu subject itself,
 * access token and profile remain outside runtime progress documents.
 */
export function accountKeyForProfile(profile: ZhihuUserProfile | null | undefined) {
  const subject = profile?.id ?? profile?.urlToken;
  const secret = identitySecret();
  if (!subject || !secret) return undefined;
  return `zh_${createHmac("sha256", secret).update(`account:${subject}`).digest("base64url")}`;
}

export function deleteSession(id: string | undefined) {
  if (id) sessions.delete(id);
}

export function safeProfile(payload: unknown): ZhihuUserProfile | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const profile: ZhihuUserProfile = {};
  if (typeof value.id === "string" || typeof value.id === "number") profile.id = String(value.id);
  if (typeof value.url_token === "string") profile.urlToken = value.url_token;
  if (typeof value.name === "string") profile.name = value.name;
  if (typeof value.avatar_url === "string") profile.avatarUrl = value.avatar_url;
  if (typeof value.headline === "string") profile.headline = value.headline;
  return Object.keys(profile).length ? profile : null;
}

export function sessionFingerprint(id: string) {
  return createHash("sha256").update(id).digest("hex").slice(0, 12);
}
