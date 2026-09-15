import "server-only";
import { cookies } from "next/headers";
import { accountKeyForProfile, getSession, OAUTH_IDENTITY_COOKIE, OAUTH_SESSION_COOKIE } from "@/src/domain/oauth";

/** Resolves the current OAuth session without ever returning its access token. */
export async function getCurrentAccount() {
  const cookieStore = await cookies();
  const session = getSession(
    cookieStore.get(OAUTH_SESSION_COOKIE)?.value,
    cookieStore.get(OAUTH_IDENTITY_COOKIE)?.value,
  );
  return { authenticated: Boolean(session), accountKey: accountKeyForProfile(session?.profile) };
}
