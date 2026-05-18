import { getSiteOrigin } from "@/lib/site-url";

export const LOGIN_VERIFIED_PATH = "/login?verified=1";

/** Safe `next` target for /auth/callback (login paths only). */
export function sanitizeAuthCallbackNext(raw: string | null): string {
  if (raw == null || raw === "") return LOGIN_VERIFIED_PATH;

  let candidate = raw.trim();
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    return LOGIN_VERIFIED_PATH;
  }

  if (
    !candidate.startsWith("/login") ||
    candidate.startsWith("//") ||
    candidate.includes("://")
  ) {
    return LOGIN_VERIFIED_PATH;
  }

  const noHash = candidate.split("#")[0] ?? "";
  return noHash || LOGIN_VERIFIED_PATH;
}

/** Supabase signup / resend confirmation redirect (PKCE callback). */
export function getEmailVerificationRedirectUrl(
  requestOrigin?: string | null
): string {
  const origin = getSiteOrigin(requestOrigin);
  const next = encodeURIComponent(LOGIN_VERIFIED_PATH);
  return `${origin}/auth/callback?next=${next}`;
}
