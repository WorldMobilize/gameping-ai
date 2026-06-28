import { getSiteOrigin } from "@/lib/site-url";

/** Post-verification landing page (no login form). Fallback when no session can be established. */
export const VERIFY_SUCCESS_PATH = "/verify-success";

/** Dedicated "check your email" page shown right after signup. */
export const CHECK_EMAIL_PATH = "/check-email";

/** sessionStorage key carrying the just-signed-up email to the check-email page. */
export const PENDING_VERIFICATION_EMAIL_KEY = "gp:pending-verification-email";

/**
 * Where a freshly verified + auto-logged-in user lands after the auth callback.
 * GamePing landing page (not /recommend) by product decision.
 */
export const POST_VERIFICATION_REDIRECT = "/";

/** Legacy fallback for older verification email links. */
export const LOGIN_VERIFIED_PATH = "/login?verified=1";

function isAllowedAuthCallbackPath(path: string): boolean {
  if (path.startsWith("//") || path.includes("://")) return false;
  return (
    path === VERIFY_SUCCESS_PATH ||
    path.startsWith("/verify-success/") ||
    path.startsWith("/login")
  );
}

/** Safe `next` target for /auth/callback after email verification. */
export function sanitizeAuthCallbackNext(raw: string | null): string {
  if (raw == null || raw === "") return VERIFY_SUCCESS_PATH;

  let candidate = raw.trim();
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    return VERIFY_SUCCESS_PATH;
  }

  if (!isAllowedAuthCallbackPath(candidate)) {
    return VERIFY_SUCCESS_PATH;
  }

  const noHash = candidate.split("#")[0] ?? "";
  return noHash || VERIFY_SUCCESS_PATH;
}

/** Supabase signup / resend confirmation redirect (PKCE callback). */
export function getEmailVerificationRedirectUrl(
  requestOrigin?: string | null
): string {
  const origin = getSiteOrigin(requestOrigin);
  const next = encodeURIComponent(VERIFY_SUCCESS_PATH);
  return `${origin}/auth/callback?next=${next}`;
}
