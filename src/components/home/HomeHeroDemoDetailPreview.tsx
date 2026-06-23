import type { RefObject } from "react";
import GameDetailView from "@/components/game/GameDetailView";
import type { GameDetailViewData } from "@/components/game/game-detail-view-types";
import { steamHeaderImage } from "@/lib/curated/game-links";

/**
 * Final walkthrough step — renders the REAL game detail UI (`GameDetailView`,
 * the same component used on /game/[slug]) with static Subnautica data, scaled
 * down to fit the tutorial stage. No GameDetailView fork, no copied layout, no
 * data fetching/APIs.
 *
 * - Accent: GameDetailView reads `var(--page-accent-*)`, which on the landing
 *   route is cyan (PageAccentProvider → "cyan"), so the red game theme becomes
 *   the tutorial cyan automatically — no recolor needed.
 * - Scale: rendered at a fixed desktop width then scaled by the parent (see
 *   DEMO_DETAIL_FIXED_WIDTH) so the user sees the real page "zoomed out".
 * - It's an opaque overlay with its own scroll tape (transform applied by the
 *   parent), and `pointer-events-none` keeps it a non-interactive preview.
 */

/** Real page is rendered at this width, then scaled DOWN to the stage width by
 *  the parent so the user sees the real /game page "zoomed out". 1280 matches the
 *  real detail page's max-w-7xl content width, so the desktop proportions and
 *  two-column layout render exactly as on the live page. (A narrower width would
 *  downscale less — slightly crisper — but cram the desktop layout and change the
 *  proportions, so we keep the real-page width.) Keep in sync with the scale math
 *  in HomeHeroTasteVisual. */
export const DEMO_DETAIL_FIXED_WIDTH = 1280;

const COVER = steamHeaderImage(264710);

// Real Subnautica screenshots (Steam CDN — already-allowlisted host, stable URLs,
// captured statically so the tutorial makes NO live API calls). Distinct images so
// the gallery isn't repeated cover art. Used only by this embedded preview.
const SUBNAUTICA_SCREENSHOTS = [
  "https://cdn.akamai.steamstatic.com/steam/apps/264710/ss_e182b6b20bb797500f9f63c561586d920d44e37c.1920x1080.jpg",
  "https://cdn.akamai.steamstatic.com/steam/apps/264710/ss_970a13f246e33e0df26d93baf9f8e975732adb4b.1920x1080.jpg",
  "https://cdn.akamai.steamstatic.com/steam/apps/264710/ss_5f2f2ea498cdc632cbffd6cf37c1a09670eb3272.1920x1080.jpg",
  "https://cdn.akamai.steamstatic.com/steam/apps/264710/ss_cebc378d2f7bc78978c21db4e3c5e12ccd067349.1920x1080.jpg",
];

const SUBNAUTICA_DEMO_DATA: GameDetailViewData = {
  title: "Subnautica",
  breadcrumbs: [
    { label: "Home", href: "/" },
    { label: "Recommend", href: "/recommend" },
    { label: "Subnautica" },
  ],
  description:
    "Crash-landed on an alien ocean planet, you scavenge, craft, and dive ever deeper to survive — uncovering the story of what happened here. Build bases and submarines, manage oxygen and pressure, and let curiosity pull you into the dark. Explore a world full of mystery, survival, crafting, and discovery.",
  heroImage: COVER,
  genres: ["Survival", "Adventure", "Open World", "Crafting"],
  ratingDisplay: "4.4 / 5",
  metacriticDisplay: "87",
  releaseDateDisplay: "Jan 23, 2018",
  genresLine: "Survival, Adventure, Open World",
  platforms: "PC, PS4, Xbox One, Switch",
  developers: "Unknown Worlds Entertainment",
  publishers: "Unknown Worlds Entertainment",
  esrb: "E10+",
  audienceLine: "Great for players who love open-ended exploration and survival crafting.",
  audienceLabel: "From your search",

  pricingMode: "verified_price",
  hasTrustedVerifiedBuy: true,
  hasVerifiedStoreListings: true,
  showSplitPrimaryLayout: false,
  showEstimatedPriceNoStoreLinks: false,
  primaryUsdFallback: false,
  primaryTrustedBuyUrl: "#",
  primaryDeal: {
    id: "steam",
    storeName: "Steam",
    matchedTitle: "Subnautica",
    normalPrice: "$29.99",
    salePrice: "$14.99",
    currency: "USD",
    provider: "Steam",
    buyUrl: "#",
    buyLabel: "Buy",
  },
  bestPrice: { displayPrice: "$14.99", storeName: "Steam", matchedTitle: "Subnautica" },
  otherTrustedDeals: [
    {
      id: "epic",
      storeName: "Epic Games",
      matchedTitle: "Subnautica",
      normalPrice: "$29.99",
      salePrice: "$16.99",
      currency: "USD",
      provider: "Epic",
      buyUrl: "#",
      buyLabel: "Buy",
    },
  ],
  trustedOffers: [
    {
      id: "steam",
      storeName: "Steam",
      matchedTitle: "Subnautica",
      normalPrice: "$29.99",
      salePrice: "$14.99",
      currency: "USD",
      provider: "Steam",
      buyUrl: "#",
      buyLabel: "Buy",
    },
    {
      id: "epic",
      storeName: "Epic Games",
      matchedTitle: "Subnautica",
      normalPrice: "$29.99",
      salePrice: "$16.99",
      currency: "USD",
      provider: "Epic",
      buyUrl: "#",
      buyLabel: "Buy",
    },
  ],
  untrustedDeals: [],
  dealsLastCheckedLabel: "just now",
  priceDisclaimer: "Demo prices — not a live store lookup.",

  sidebarShowsPriceFigure: true,
  sidebarIsGenericUnavailable: false,
  sidebarPriceTitle: "Best verified store price",
  sidebarPriceValue: "$14.99",
  sidebarPriceBody: "Lowest verified price from our supported stores.",

  screenshots: SUBNAUTICA_SCREENSHOTS.map((image, index) => ({
    id: index + 1,
    image,
  })),

  recommendFit: {
    reason:
      "Subnautica leans right into the exploration and survival loop you keep gravitating toward — open-ended discovery with a steady crafting backbone.",
    matchNote: "Matches your taste for exploration and survival.",
    match: 94,
    matchTier: "best_match",
    concern: "Lighter on direct combat than some survival games.",
  },
  fitTransparencyNote: "Demo fit — based on a sample search. Not live tracking yet.",

  curatedCollection: { slug: "underwater-survival", h1: "Underwater survival picks" },
  relatedGames: [
    { title: "Outer Wilds" },
    { title: "Raft" },
    { title: "Stranded Deep" },
    { title: "Dredge" },
  ],
};

export default function HomeHeroDemoDetailPreview({
  theme,
  open,
  viewportRef,
  tapeRef,
  scalerRef,
}: {
  theme: "dark" | "light";
  open: boolean;
  viewportRef: RefObject<HTMLDivElement | null>;
  tapeRef: RefObject<HTMLDivElement | null>;
  scalerRef: RefObject<HTMLDivElement | null>;
}) {
  // The embedded preview reuses the REAL GameDetailView, whose full-page hero is
  // built for the dark cinematic Games backdrop in BOTH themes (white hero text +
  // a from-black/via-#070b14 scrim). So the wrapper shows the SAME cinematic
  // landing image (via .gp-demo-detail-bg) rather than a flat dark/grey block:
  // light mode keeps the landing's "dark room, light cards" model and the preview
  // visually integrates with the tutorial instead of reading as a black wrapper.
  return (
    <div
      ref={viewportRef}
      className={`gp-demo-detail-bg absolute inset-0 overflow-hidden transition-opacity duration-500 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      {/* Outer tape = animated scroll (translateY only). Inner scaler = static
          scale (no will-change), so text re-rasterizes crisply at the scaled
          size instead of being a blurred cached bitmap. The parent sets both
          transforms. */}
      <div ref={tapeRef} className="will-change-transform">
        <div
          ref={scalerRef}
          style={{ width: DEMO_DETAIL_FIXED_WIDTH, transformOrigin: "top left" }}
          className="pointer-events-none"
        >
          <GameDetailView data={SUBNAUTICA_DEMO_DATA} theme={theme} showExploreSection />
        </div>
      </div>
    </div>
  );
}
