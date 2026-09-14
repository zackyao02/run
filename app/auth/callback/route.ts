import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { assertPublicRedirectUri, consumePendingState, createIdentityCookieValue, createSession, getOAuthConfig, normalizeReturnTo, OAUTH_IDENTITY_COOKIE, OAUTH_SESSION_COOKIE, OAUTH_STATE_COOKIE, safeProfile } from "@/src/domain/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("authorization_code") ?? url.searchParams.get("code") ?? "";
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  // CloudBase forwards the callback through the container address (often
  // 0.0.0.0:80). Always return the browser to the configured public origin
  // instead of leaking that internal address into the OAuth redirect.
  const publicOrigin = (() => {
    try {
      const configured = getOAuthConfig().redirectUri;
      return configured ? new URL(assertPublicRedirectUri(configured)).origin : url.origin;
    } catch {
      return url.origin;
    }
  })();
  const pending = consumePendingState(state, stateCookie);
  const returnTo = normalizeReturnTo(pending?.returnTo);
  const redirectHome = (status: string) => {
    const target = new URL(returnTo, publicOrigin);
    target.searchParams.set("oauth", status);
    return NextResponse.redirect(target);
  };
  if (!pending) return redirectHome("state_error");
  if (!code) return redirectHome("code_missing");

  try {
    const { appId, appKey, redirectUri } = getOAuthConfig();
    if (!appId || !appKey) return redirectHome("not_configured");
    const callback = assertPublicRedirectUri(redirectUri);
    const form = new URLSearchParams({ app_id: appId, app_key: appKey, grant_type: "authorization_code", redirect_uri: callback, code });
    const tokenResponse = await fetch("https://openapi.zhihu.com/access_token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: form, cache: "no-store" });
    if (!tokenResponse.ok) return redirectHome("token_error");
    const tokenPayload: unknown = await tokenResponse.json();
    if (!tokenPayload || typeof tokenPayload !== "object") return redirectHome("token_error");
    const token = tokenPayload as Record<string, unknown>;
    if (typeof token.access_token !== "string" || !token.access_token) return redirectHome("token_error");
    const expiresIn = typeof token.expires_in === "number" ? token.expires_in : 3600;
    let profile = null;
    const profileResponse = await fetch("https://openapi.zhihu.com/user", { headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" }, cache: "no-store" });
    if (profileResponse.ok) profile = safeProfile(await profileResponse.json());
    const session = createSession(token.access_token, expiresIn, profile);
    const response = redirectHome("success");
    response.cookies.set(OAUTH_SESSION_COOKIE, session.id, { httpOnly: true, secure: true, sameSite: "lax", maxAge: Math.max(60, expiresIn), path: "/" });
    const identity = createIdentityCookieValue(profile, session.expiresAt);
    if (identity) response.cookies.set(OAUTH_IDENTITY_COOKIE, identity, { httpOnly: true, secure: true, sameSite: "lax", maxAge: Math.max(60, expiresIn), path: "/" });
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch {
    return redirectHome("error");
  }
}
