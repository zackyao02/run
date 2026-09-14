import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession, OAUTH_SESSION_COOKIE } from "@/src/domain/oauth";

export async function POST() {
  const cookieStore = await cookies();
  deleteSession(cookieStore.get(OAUTH_SESSION_COOKIE)?.value);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(OAUTH_SESSION_COOKIE);
  return response;
}
