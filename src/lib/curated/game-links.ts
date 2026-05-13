/** Matches `src/app/game/[slug]/page.tsx`: title from decodeURIComponent(slug). */
export function gameDetailPath(title: string): string {
  return `/game/${encodeURIComponent(title.trim().toLowerCase())}`;
}

export function steamHeaderImage(steamAppId: number): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/header.jpg`;
}
