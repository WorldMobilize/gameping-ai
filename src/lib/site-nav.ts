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
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Hidden Gems", href: "/hidden-gems", matchPrefix: "/hidden-gems" },
  {
    label: "Games of the Week",
    href: "/games-of-the-week",
    matchPrefix: "/games-of-the-week",
  },
];

/** Premium discovery — shown in nav only when plan is premium or admin. */
export const PREMIUM_DISCOVERY_NAV_ITEMS: SiteNavItem[] = [
  {
    label: "Your weekly picks",
    href: "/weekly-picks",
    matchPrefix: "/weekly-picks",
  },
  { label: "Deals for you", href: "/deals-for-you", matchPrefix: "/deals-for-you" },
  {
    label: "Monthly recap",
    href: "/monthly-recap",
    matchPrefix: "/monthly-recap",
  },
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
