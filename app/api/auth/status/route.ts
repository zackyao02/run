import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession, OAUTH_IDENTITY_COOKIE, OAUTH_SESSION_COOKIE } from "@/src/domain/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const session = getSession(cookieStore.get(OAUTH_SESSION_COOKIE)?.value, cookieStore.get(OAUTH_IDENTITY_COOKIE)?.value);
  const headers = { "Cache-Control": "no-store" };
  if (!session) return NextResponse.json({ authenticated: false }, { headers });
  return NextResponse.json({ authenticated: true, expiresAt: session.expiresAt, profile: session.profile }, { headers });
}
