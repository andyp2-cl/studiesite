export const LOGIN_PATH = "/logga-in";

/**
 * Returns a same-site path to continue to after login, or "/" if `next` is
 * missing or could point to another site (open-redirect protection).
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  if (next.startsWith(LOGIN_PATH)) return "/";
  return next;
}
