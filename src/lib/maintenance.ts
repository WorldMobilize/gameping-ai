/**
 * Maintenance mode — the single switch, and the single list of what survives it.
 *
 * Enforcement lives in ONE place (src/middleware.ts). No page, layout or route
 * checks this itself: a per-page check is a per-page thing to forget, and the one
 * you forget is the one that leaks.
 *
 * Turned on with a server-side env var:
 *
 *   MAINTENANCE_MODE=true
 *
 * Deliberately NOT `NEXT_PUBLIC_`: this decides who may see the site, so it must be
 * read on the server only. A NEXT_PUBLIC_ flag is shipped to the browser and is
 * advisory at best — anyone can ignore it.
 *
 * Admins (profiles.plan === "admin") pass straight through. Everyone else —
 * anonymous, free, premium — lands on the maintenance page whatever URL they asked
 * for.
 */

export const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";

export const MAINTENANCE_PATH = "/maintenance";

/**
 * Supabase user ids let past maintenance WITHOUT being admins — the free and
 * premium test accounts, so the site can be smoke-tested while it stays down for
 * everyone else.
 *
 *   MAINTENANCE_ALLOWLIST_USER_IDS=<uuid>,<uuid>
 *
 * This buys a way past the closed door and NOTHING else. It is deliberately not
 * wired into the admin check: an allowlisted free account still gets a 404 on
 * /admin, still hits the free daily limits, still sees premium pages refuse it.
 * That is the entire point — an escape hatch that also handed out privileges
 * would test a user who does not exist.
 *
 * Ids, not emails: the session carries the id anyway, and an email in an env var
 * is PII sitting somewhere it does not need to be. Server-side only (no
 * NEXT_PUBLIC_) for the same reason MAINTENANCE_MODE is — a flag shipped to the
 * browser is advisory, and this one decides who gets in.
 *
 * Unset or empty = nobody. Clearing the var closes the hatch with no deploy of
 * code, and leaving it set past the test is the mistake to watch for.
 */
const MAINTENANCE_ALLOWLIST_USER_IDS: readonly string[] = (
  process.env.MAINTENANCE_ALLOWLIST_USER_IDS ?? ""
)
  .split(",")
  .map((id) => id.trim().toLowerCase())
  .filter((id) => id.length > 0);

/** True when this user id is on the maintenance allowlist. Never implies admin. */
export function isMaintenanceAllowlistedUser(
  userId: string | null | undefined
): boolean {
  if (!userId) return false;
  return MAINTENANCE_ALLOWLIST_USER_IDS.includes(userId.trim().toLowerCase());
}

/**
 * The only paths that stay reachable while maintenance is on.
 *
 * The login flow HAS to be here. An admin arriving signed-out must be able to sign
 * in — lock /login behind maintenance and the only people who can turn the site back
 * on are the ones already holding a session. That is how you lock yourself out.
 *
 * Signup is NOT here: no new accounts while the site is down.
 */
const ALLOWED_PREFIXES = [
  MAINTENANCE_PATH,

  // Sign-in and session recovery, so an admin can always get back in.
  "/login",
  "/auth/",
  "/reset-password",
  "/update-password",
  "/check-email",
  "/verify-success",

  // Crawler and browser furniture. Redirecting these to an HTML page tells Google
  // the sitemap moved, which is a lie we would still be paying for next month.
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
  "/opengraph-image",
  "/twitter-image",
];

/** True when this path must keep working even with maintenance mode on. */
export function isMaintenanceExempt(pathname: string): boolean {
  return ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(prefix)
  );
}

/**
 * Pages that do not exist for the public. Two kinds, and they are here for different
 * reasons:
 *
 *  * NOT REAL YET — a concept demo (/community-wars) and a feature that does not
 *    exist (/parties). Shipping them would sell something we do not have. They come
 *    off this list when they are real, not when they look ready.
 *  * ADMIN TOOLS — the analytics and creator-earnings dashboards. Not unfinished:
 *    simply nobody else's business. They read other people's emails and accounting.
 *
 * /creators is deliberately NOT here any more: the creator programme can now issue
 * codes and accrue commission, so the page no longer promises money it cannot pay.
 *
 * /worldmobilize is not here either, and that is not an oversight: the route already
 * renders a Coming Soon placeholder rather than the live claim map, so the real thing
 * is closed without a 404. Its nav item is a working link with a padlock — gate the
 * route and that padlock starts promising a page that does not exist.
 *
 * Enforced in the middleware, and that is not an implementation detail. The gate used
 * to live in the page tree (`AdminOnlyPageGate`), which blocks the CONTENT but cannot
 * fix the STATUS: by the time an async Supabase lookup deep in the tree calls
 * notFound(), the 200 has already gone out, and the page becomes a soft-404 — a page
 * that tells Google "here I am, all fine" while showing a not-found body. Deciding in
 * the middleware means nothing has been sent yet, so a real 404 is still possible.
 * The admin dashboards still keep their own in-page notFound() as a second lock: this
 * list decides what is REACHABLE, the page decides what it will SERVE.
 */
const ADMIN_ONLY_PREFIXES = [
  "/community-wars",
  "/parties",
  "/admin",
  "/creators/admin",
];

/**
 * Companion is NOT here, on purpose: it ships with the site, so /companion,
 * /companion/web and /companion/about are all public.
 *
 * Worth knowing anyway: gating those pages would not have protected the app. The
 * installer is a PUBLIC object in Supabase Storage, and /api/companion/releases/latest
 * hands its URL to anyone who asks. Hiding the page hides the button, not the file —
 * so if Companion ever needs to be paid-only, the fix belongs in the bucket, not here.
 */
export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
