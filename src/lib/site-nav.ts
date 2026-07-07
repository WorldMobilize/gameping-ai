/** Primary app navigation (client-safe). */

export type SiteNavItem = {
  label: string;
  href: string;
  /** Match pathname prefix (e.g. /curated/foo → /curated). */
  matchPrefix?: string;
};

export const HOME_NAV_ITEM: SiteNavItem = { label: "Home", href: "/" };

/**
 * Ecosystem pillars. The hamburger drawer is the full navigation source of
 * truth; the desktop navbar shows one link per pillar. All routes below exist
 * today — nothing here points at unbuilt pages.
 */

/** Discover — public discovery surfaces (all live). */
export const DISCOVER_NAV_ITEMS: SiteNavItem[] = [
  { label: "AI Recommendations", href: "/recommend", matchPrefix: "/recommend" },
  {
    label: "Curated Collections",
    href: "/curated",
    matchPrefix: "/curated",
  },
  { label: "Hidden Gems", href: "/hidden-gems", matchPrefix: "/hidden-gems" },
  {
    label: "Games of the Week",
    href: "/games-of-the-week",
    matchPrefix: "/games-of-the-week",
  },
  { label: "A–Z Games Directory", href: "/games", matchPrefix: "/games" },
  { label: "Features", href: "/how-it-works", matchPrefix: "/how-it-works" },
];

/**
 * Discover — personalized picks. Premium/admin see live personal content;
 * free/anon get the same links with a lock (the page shows a locked preview).
 */
export const DISCOVER_PERSONAL_NAV_ITEMS: SiteNavItem[] = [
  {
    label: "Weekly Picks",
    href: "/weekly-picks",
    matchPrefix: "/weekly-picks",
  },
  {
    label: "Monthly Recap",
    href: "/monthly-recap",
    matchPrefix: "/monthly-recap",
  },
];

/** Deals — price tracking lives on the dashboard; Deals For You is premium. */
export const DEALS_NAV_ITEMS: SiteNavItem[] = [
  { label: "Track Prices", href: "/dashboard", matchPrefix: "/dashboard" },
];

/** Deals — premium/locked-preview entries (same lock rule as Discover picks). */
export const DEALS_PERSONAL_NAV_ITEMS: SiteNavItem[] = [
  { label: "Deals For You", href: "/deals-for-you", matchPrefix: "/deals-for-you" },
];

export const PREMIUM_NAV_ITEM: SiteNavItem = {
  label: "Go Premium",
  href: "/upgrade",
  matchPrefix: "/upgrade",
};

/** Community — admin-only concept demo (noindexed, gated to plan === "admin"). */
export const COMMUNITY_WARS_NAV_ITEM: SiteNavItem = {
  label: "Community Wars",
  href: "/community-wars",
  matchPrefix: "/community-wars",
};

/** Companion — admin-only alpha. */
export const COMPANION_NAV_ITEM: SiteNavItem = {
  label: "Desktop Companion",
  href: "/companion",
  matchPrefix: "/companion",
};

/** Account section (login/logout is rendered from auth state, not listed here). */
export const ACCOUNT_NAV_ITEMS: SiteNavItem[] = [
  { label: "Dashboard", href: "/dashboard", matchPrefix: "/dashboard" },
  { label: "Account Settings", href: "/settings/account", matchPrefix: "/settings" },
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
