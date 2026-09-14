import { NextResponse } from "next/server";
import { assertPublicRedirectUri, createPendingState, getOAuthConfig, OAUTH_STATE_COOKIE } from "@/src/domain/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { appId, appKey, redirectUri } = getOAuthConfig();
    if (!appId || !appKey) return NextResponse.json({ error: "OAUTH_CREDENTIALS_NOT_CONFIGURED", message: "请在服务端配置 App ID 与 App Key。" }, { status: 503 });
    const callback = assertPublicRedirectUri(redirectUri);
    const state = createPendingState();
    const authorize = new URL("https://openapi.zhihu.com/authorize");
    authorize.searchParams.set("redirect_uri", callback);
    authorize.searchParams.set("app_id", appId);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("state", state);
    const response = NextResponse.redirect(authorize);
    response.cookies.set(OAUTH_STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
    return response;
  } catch (error) {
    const message = error instanceof Error && error.message === "OAUTH_REDIRECT_URI_NOT_CONFIGURED"
      ? "请先部署到公网 HTTPS，并配置 OAuth 回调地址。"
      : "OAuth 回调地址必须是公网 HTTPS 且以 /auth/callback 结尾。";
    return NextResponse.json({ error: "OAUTH_REDIRECT_URI_INVALID", message }, { status: 503 });
  }
}
