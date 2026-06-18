/** Matches `src/app/game/[slug]/page.tsx`: title from decodeURIComponent(slug). */
export function gameDetailPath(title: string): string {
  return `/game/${encodeURIComponent(title.trim().toLowerCase())}`;
}

export function steamHeaderImage(steamAppId: number): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/header.jpg`;
}

/** Portrait library cover (2:3) — same Steam CDN host already allowlisted in next.config. */
export function steamPortraitImage(steamAppId: number): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/library_600x900.jpg`;
}
