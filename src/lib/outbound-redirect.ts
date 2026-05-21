/**
 * Allowlist for /api/out `to` / `url` redirects (price alerts, future tracked outbound).
 * Only https/http; host must match exactly or via approved suffix rules.
 */

/** Exact hostnames (lowercase, no port). */
export const OUTBOUND_REDIRECT_ALLOWED_HOSTNAMES = new Set([
  "cheapshark.com",
  "www.cheapshark.com",
  "store.steampowered.com",
  "www.greenmangaming.com",
  "www.fanatical.com",
  "www.humblebundle.com",
  "itad.link",
  "www.itad.link",
  "www.gog.com",
  "gog.com",
  "www.epicgames.com",
  "epicgames.com",
]);

/** Host equals suffix or is a subdomain of suffix (e.g. store.steampowered.com). */
export const OUTBOUND_REDIRECT_ALLOWED_HOST_SUFFIXES = [
  "steampowered.com",
  "cheapshark.com",
  "itad.link",
] as const;

export function isAllowedOutboundRedirectHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (OUTBOUND_REDIRECT_ALLOWED_HOSTNAMES.has(host)) return true;
  return OUTBOUND_REDIRECT_ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}

/**
 * Validates a user-supplied redirect target. Returns normalized URL string or null.
 */
export function parseAllowedOutboundRedirectUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl?.trim()) return null;

  try {
    const url = new URL(rawUrl.trim());
    const protocol = url.protocol.toLowerCase();
    if (protocol !== "https:" && protocol !== "http:") return null;
    if (!isAllowedOutboundRedirectHostname(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Query param names accepted for outbound redirect targets (first match wins). */
export function readOutboundRedirectTargetParam(
  searchParams: URLSearchParams
): string | null {
  for (const key of ["to", "url", "redirect", "rawUrl"] as const) {
    const value = searchParams.get(key);
    if (value?.trim()) return value.trim();
  }
  return null;
}
