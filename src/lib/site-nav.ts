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
];

/**
 * Discovery feature pages — now PUBLIC (cached, cron-published rotations). Shown
 * to everyone in the drawer and, space permitting, in the desktop nav.
 */
export const DISCOVERY_NAV_ITEMS: SiteNavItem[] = [
  { label: "Hidden Gems", href: "/hidden-gems", matchPrefix: "/hidden-gems" },
  {
    label: "Games of the Week",
    href: "/games-of-the-week",
    matchPrefix: "/games-of-the-week",
  },
];

/**
 * Premium personal discovery — LIVE pages. Premium/admin see real personalized
 * content; free/anon get a locked preview (shown with a lock in nav). Always
 * listed in the drawer's Premium section; shown on desktop at 2xl, space
 * permitting.
 */
export const PREMIUM_DISCOVERY_NAV_ITEMS: SiteNavItem[] = [
  {
    label: "Weekly Picks",
    href: "/weekly-picks",
    matchPrefix: "/weekly-picks",
  },
  { label: "Deals For You", href: "/deals-for-you", matchPrefix: "/deals-for-you" },
  {
    label: "Monthly Recap",
    href: "/monthly-recap",
    matchPrefix: "/monthly-recap",
  },
];

/** GamePing Parties — admin-only, future feature. Not in public nav. */
export const PARTIES_NAV_ITEM: SiteNavItem = {
  label: "GamePing Parties",
  href: "/parties",
  matchPrefix: "/parties",
};

export const PARTIES_SUBNAV_ITEMS: SiteNavItem[] = [
  { label: "Competitive", href: "/parties#competitive" },
  { label: "Co-op / PvE", href: "/parties#co-op" },
  { label: "Survival", href: "/parties#survival" },
  { label: "Strategy", href: "/parties#strategy" },
  { label: "Weekend squads", href: "/parties#weekend-squads" },
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
