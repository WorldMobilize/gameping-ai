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
 * Discovery feature pages — incomplete/future features, gated ADMIN ONLY for now
 * (same profiles.plan === "admin" check as AdminOnlyPageGate). Hidden from the
 * public nav, drawer, and footer until they ship.
 */
export const ADMIN_DISCOVERY_NAV_ITEMS: SiteNavItem[] = [
  { label: "Hidden Gems", href: "/hidden-gems", matchPrefix: "/hidden-gems" },
  {
    label: "Games of the Week",
    href: "/games-of-the-week",
    matchPrefix: "/games-of-the-week",
  },
];

/** Premium personal discovery — admin-only while incomplete (was premium-or-admin). */
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
