import "server-only";
import { timingSafeEqual } from "node:crypto";

export function isOperatorRequest(request: Request): boolean {
  const expected = process.env.OPERATOR_SECRET?.trim();
  const provided = request.headers.get("x-operator-secret")?.trim();
  // /dev/ops does not exist in production. Local loopback is allowed to use
  // the internal pipeline without a second development credential; deployed
  // instances always require a configured server-side secret.
  const hostname = new URL(request.url).hostname;
  const localLoopback = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
  if (process.env.NODE_ENV !== "production" && localLoopback) return true;
  if (!expected || !provided) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  return left.length === right.length && timingSafeEqual(left, right);
}
