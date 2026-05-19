/** Primary app navigation (client-safe). */

export type SiteNavItem = {
  label: string;
  href: string;
  /** Match pathname prefix (e.g. /curated/foo → /curated). */
  matchPrefix?: string;
};

export const SITE_NAV_ITEMS: SiteNavItem[] = [
  { label: "Home", href: "/" },
  { label: "AI Recommendations", href: "/recommend", matchPrefix: "/recommend" },
  {
    label: "Curated Collections",
    href: "/curated",
    matchPrefix: "/curated",
  },
  { label: "A–Z Games Directory", href: "/games", matchPrefix: "/games" },
];

export function isSiteNavItemActive(
  pathname: string | null,
  item: SiteNavItem
): boolean {
  if (!pathname) return false;
  if (item.href === "/") return pathname === "/";
  const prefix = item.matchPrefix ?? item.href;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
