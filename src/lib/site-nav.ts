/** Primary app navigation (client-safe). */

export type SiteNavItem = {
  label: string;
  href: string;
  /** Match pathname prefix (e.g. /curated/foo → /curated). */
  matchPrefix?: string;
  /** Only shown to logged-in users (e.g. Settings). */
  memberOnly?: boolean;
  /**
   * Personalized surface. Free/anon users still reach the page (it shows its own
   * locked preview) — the padlock in the nav just sets the expectation first.
   */
  premium?: boolean;
  /**
   * Destination for premium/admin users, when it differs from the public one.
   * Taste DNA and Steam Library are the tool itself for a subscriber and an
   * explainer page for everyone else — sending a free user to the settings
   * anchor would land them on a section that isn't rendered for them.
   */
  premiumHref?: string;
};

export const HOME_NAV_ITEM: SiteNavItem = { label: "Home", href: "/" };

/** Where a subscriber actually manages their Steam import / Taste DNA. */
const STEAM_IMPORT_SETTINGS_HREF = "/settings/account#steam-library-import";

/**
 * Ecosystem pillars. The hamburger drawer is the full navigation source of
 * truth; the desktop navbar shows one link per pillar. All routes below exist
 * today — nothing here points at unbuilt pages.
 */

/** Discover — public discovery surfaces (all live). */
export const DISCOVER_NAV_ITEMS: SiteNavItem[] = [
  { label: "AI Recommendations", href: "/recommend", matchPrefix: "/recommend" },
  { label: "Games Like…", href: "/games-like", matchPrefix: "/games-like" },
  {
    label: "Curated Collections",
    href: "/collections",
    matchPrefix: "/collections",
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

/**
 * Navbar "Discovery" dropdown — the live product surfaces a visitor should
 * reach in one click from anywhere. Deals For You uses the premium lock rule.
 */
export const NAVBAR_DISCOVERY_MENU_ITEMS: SiteNavItem[] = [
  ...DISCOVER_NAV_ITEMS.filter((item) => item.href !== "/how-it-works"),
  ...DEALS_PERSONAL_NAV_ITEMS,
];

/**
 * Discovery — now a PRODUCT HUB (top-level nav link, no dropdown). The overview
 * page at /discover introduces every Discovery tool; individual tool pages are
 * reached from there instead of being exposed directly in the nav.
 */
export const DISCOVER_HUB_NAV_ITEM: SiteNavItem = {
  label: "Discovery",
  href: "/discover",
  matchPrefix: "/discover",
};

/**
 * World Mobilize — the community-game pillar (admin-only alpha for now).
 * The interactive world map is the pillar's front door; the Community Wars
 * concept demo lives alongside it.
 */
export const WORLDMOBILIZE_NAV_ITEM: SiteNavItem = {
  label: "World Mobilize",
  href: "/worldmobilize",
  matchPrefix: "/worldmobilize",
};

export const COMMUNITY_WARS_NAV_ITEM: SiteNavItem = {
  label: "Community Wars",
  href: "/community-wars",
  matchPrefix: "/community-wars",
};

/** Companion — desktop overlay app. */
export const COMPANION_NAV_ITEM: SiteNavItem = {
  label: "Companion",
  href: "/companion",
  matchPrefix: "/companion",
};

/**
 * Pillar child links — shown indented under each pillar in the drawer so users
 * who know what they want can jump straight to it, while the pillar heading
 * still opens the overview. Some World Mobilize / Companion modules point at the
 * pillar's front door as placeholders until they get dedicated pages.
 */
export const DISCOVERY_CHILD_ITEMS: SiteNavItem[] = [
  { label: "AI Recommendations", href: "/recommend", matchPrefix: "/recommend" },
  { label: "Games Like…", href: "/games-like", matchPrefix: "/games-like" },
  { label: "Hidden Gems", href: "/hidden-gems", matchPrefix: "/hidden-gems" },
  { label: "Games of the Week", href: "/games-of-the-week", matchPrefix: "/games-of-the-week" },
  { label: "Curated Collections", href: "/collections", matchPrefix: "/collections" },
  { label: "A–Z Games Directory", href: "/games", matchPrefix: "/games" },
  { label: "Deals For You", href: "/deals-for-you", matchPrefix: "/deals-for-you", premium: true },
  { label: "Weekly Picks", href: "/weekly-picks", matchPrefix: "/weekly-picks", premium: true },
  { label: "Monthly Recap", href: "/monthly-recap", matchPrefix: "/monthly-recap", premium: true },
  {
    label: "Taste DNA",
    href: "/how-it-works/taste-memory",
    matchPrefix: "/how-it-works/taste-memory",
    premiumHref: STEAM_IMPORT_SETTINGS_HREF,
    premium: true,
  },
  {
    label: "Steam Library",
    href: "/how-it-works/steam-import",
    matchPrefix: "/how-it-works/steam-import",
    premiumHref: STEAM_IMPORT_SETTINGS_HREF,
    premium: true,
  },
];

export const WORLDMOBILIZE_CHILD_ITEMS: SiteNavItem[] = [
  { label: "World Map", href: "/worldmobilize", matchPrefix: "/worldmobilize" },
  { label: "Community Wars", href: "/community-wars", matchPrefix: "/community-wars" },
  { label: "Territories", href: "/worldmobilize" },
  { label: "Leaderboards", href: "/worldmobilize" },
];

export const COMPANION_CHILD_ITEMS: SiteNavItem[] = [
  { label: "Companion", href: "/companion", matchPrefix: "/companion" },
  { label: "Overlay", href: "/companion" },
];

/** Account section (login/logout is rendered from auth state, not listed here). */
export const ACCOUNT_NAV_ITEMS: SiteNavItem[] = [
  { label: "Dashboard", href: "/dashboard", matchPrefix: "/dashboard" },
  { label: "Account Settings", href: "/settings/account", matchPrefix: "/settings" },
];

/**
 * Drawer "More" section — site/utility links in the main nav flow.
 * Account/settings actions live in the separated bottom section instead.
 */
export const DRAWER_MORE_ITEMS: SiteNavItem[] = [
  { label: "How it works", href: "/how-it-works", matchPrefix: "/how-it-works" },
  { label: "Creator program", href: "/creators", matchPrefix: "/creators" },
  { label: "About", href: "/about", matchPrefix: "/about" },
  { label: "Contact", href: "/contact", matchPrefix: "/contact" },
];

/** Bottom "Account & settings" area of the drawer (member-only entries). */
export const DRAWER_ACCOUNT_ITEMS: SiteNavItem[] = [
  { label: "Dashboard", href: "/dashboard", matchPrefix: "/dashboard" },
  { label: "Settings", href: "/settings/account", matchPrefix: "/settings" },
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
