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
