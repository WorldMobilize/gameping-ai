import type { Metadata } from "next";
import { headers } from "next/headers";
import AppPageShell from "@/components/app/AppPageShell";
import { gameDetailPath } from "@/lib/curated/game-links";
import {
  buildGameBreadcrumbs,
  buildGamePageMetadata,
  findCuratedCollectionsForGame,
  findDirectoryGameImage,
  getSemanticRelatedGames,
  titleCaseFromSlug,
} from "@/lib/seo/game-page";
import GameStructuredData from "@/components/GameStructuredData";
import GamePageAnalytics from "@/components/GamePageAnalytics";
import TrackPriceButton, {
  type TrackPriceOfferSnapshot,
} from "@/components/TrackPriceButton";
import { getCachedRawgGame, setCachedRawgGame } from "@/lib/cache";
import { resolveGameDetailFreeToPlay } from "@/lib/game-detail-free-to-play";
import { getRawgGameMedia } from "@/lib/rawg-game-media-cache";
import { isCheapSharkUsdFallbackProvider } from "@/lib/pricing/display";
import { resolvePricingContext } from "@/lib/pricing/pricing-context";
import type { BestPriceResult } from "@/lib/pricing/price-service";
import {
  buildUnifiedTrustedVerifiedOffers,
  lookupBestPrice,
  lookupDeals,
  parseVerifiedDealSalePrice,
} from "@/lib/pricing/price-service";
import { formatDisplayDate } from "@/lib/format-display-date";
import PersonalGameFitCard from "@/components/PersonalGameFitCard";
import GameDetailView from "@/components/game/GameDetailView";
import { buildGameDetailViewData } from "@/components/game/build-game-detail-view-data";

type RawgGame = {
  id: number;
  name: string;
  description_raw?: string;
  background_image?: string;
  rating?: number;
  ratings_count?: number;
  metacritic?: number;
  released?: string;
  genres?: { name: string }[];
  tags?: { name: string }[];
  platforms?: { platform: { name: string } }[];
  stores?: { store?: { slug?: string; name?: string }; url?: string }[];
  developers?: { name: string }[];
  publishers?: { name: string }[];
  esrb_rating?: { name: string };
};

type RecommendFitContext = {
  reason: string;
  matchNote?: string;
  match?: number;
  matchTier?: "best_match" | "good_alternative" | "partial_match";
};

type PricingUiMode =
  | "free_to_play"
  | "verified_price"
  | "likely_console_or_unsupported"
  | "unavailable";

function parsePriceAmount(price: string | undefined): number | null {
  if (!price) return null;
  if (/^free$/i.test(price.trim())) return 0;
  const n = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function isFreeToPlayPriceState(best: BestPriceResult | null): boolean {
  if (!best) return false;
  if (best.provider === "free_to_play" || /^free$/i.test((best.price || "").trim())) {
    return true;
  }
  const n = parsePriceAmount(best.price);
  return best.provider === "cheapshark" && n !== null && n <= 0;
}

function hasVerifiedAggregatorPrice(best: BestPriceResult | null): boolean {
  if (!best || isFreeToPlayPriceState(best)) return false;
  const n = parsePriceAmount(best.price);
  return n !== null && n > 0;
}

function rawgPlatformsBlob(rawg: RawgGame | null): string {
  if (!rawg?.platforms?.length) return "";
  return rawg.platforms.map((p) => p.platform.name).join(" ").toLowerCase();
}

/** Console-first listing with no PC / Steam / Mac / Linux hints — CheapShark is PC-deal heavy. */
function isLikelyConsoleOnly(rawg: RawgGame | null): boolean {
  const blob = rawgPlatformsBlob(rawg);
  if (!blob.trim()) return false;
  const consoleHints =
    /\b(nintendo|switch|wii|wii ?u|playstation|ps[2345]|xbox|xbox one|xbox series|series [sx]|3ds)\b/i.test(
      blob
    );
  const pcHints =
    /\b(pc|windows|win32|steam|macos|linux|\bmac\b|gog|epic games|itch)\b/i.test(blob);
  return consoleHints && !pcHints;
}

function derivePricingUiMode(
  best: BestPriceResult | null,
  rawg: RawgGame | null
): PricingUiMode {
  if (isFreeToPlayPriceState(best)) return "free_to_play";
  if (hasVerifiedAggregatorPrice(best)) return "verified_price";
  if (isLikelyConsoleOnly(rawg)) return "likely_console_or_unsupported";
  return "unavailable";
}

async function getRawgGame(title: string): Promise<RawgGame | null> {
  try {
    const slug = encodeURIComponent(title.trim().toLowerCase());
    const cached = await getCachedRawgGame<RawgGame>(slug);
    if (cached) return cached;

    const searchRes = await fetch(
      `https://api.rawg.io/api/games?key=${
        process.env.RAWG_API_KEY
      }&search=${encodeURIComponent(title)}&page_size=1`,
      { cache: "no-store" }
    );

    const searchData = await searchRes.json();
    const firstGame = searchData.results?.[0];

    if (!firstGame?.id) return null;

    const detailRes = await fetch(
      `https://api.rawg.io/api/games/${firstGame.id}?key=${process.env.RAWG_API_KEY}`,
      { cache: "no-store" }
    );

    const payload = await detailRes.json();

    try {
      await setCachedRawgGame({
        slug,
        title,
        rawgPayload: payload,
      });
    } catch {}

    return payload;
  } catch {
    return null;
  }
}

function searchParamString(
  sp: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const raw = sp[key];
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0];
  return undefined;
}

const RECOMMEND_FIT_REASON_MAX = 600;
const RECOMMEND_FIT_NOTE_MAX = 220;

/**
 * Real recommendation context only when arriving from /recommend with a non-empty fit reason.
 * Never inferred from catalog visits alone.
 */
function parseRecommendFitContext(
  sp: Record<string, string | string[] | undefined>
): RecommendFitContext | null {
  if (searchParamString(sp, "from") !== "recommend") return null;

  const reasonRaw = searchParamString(sp, "fitReason")?.trim();
  if (!reasonRaw) return null;

  const reason =
    reasonRaw.length > RECOMMEND_FIT_REASON_MAX
      ? `${reasonRaw.slice(0, RECOMMEND_FIT_REASON_MAX).trim()}…`
      : reasonRaw;

  const matchNoteRaw = searchParamString(sp, "fitNote")?.trim();
  const matchNote =
    matchNoteRaw && matchNoteRaw.length > RECOMMEND_FIT_NOTE_MAX
      ? `${matchNoteRaw.slice(0, RECOMMEND_FIT_NOTE_MAX).trim()}…`
      : matchNoteRaw || undefined;

  const matchRaw = searchParamString(sp, "match");
  const matchNum = matchRaw ? Number(matchRaw) : NaN;
  const match = Number.isFinite(matchNum) ? Math.max(0, Math.min(100, Math.round(matchNum))) : undefined;

  const tierRaw = searchParamString(sp, "fitTier");
  const matchTier =
    tierRaw === "best_match" || tierRaw === "good_alternative" || tierRaw === "partial_match"
      ? tierRaw
      : undefined;

  return { reason, matchNote, match, matchTier };
}

function catalogAudienceLine(genres?: string): string {
  const first = genres?.split(",")[0]?.trim();
  if (first) return `Often clicks with ${first.toLowerCase()} fans exploring the catalog.`;
  return "A solid pick to explore before you personalize GamePing with a recommendation search.";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const cached = await getCachedRawgGame<RawgGame>(decoded);
  const displayName = cached?.name?.trim() || titleCaseFromSlug(decoded);
  const ogImage =
    cached?.background_image?.trim() ||
    findDirectoryGameImage(displayName) ||
    null;
  return buildGamePageMetadata(displayName, decoded, { ogImage });
}

export default async function GameDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const title = decodeURIComponent(slug);
  const sp = (await searchParams) ?? {};
  const pricingDebug = sp.debug === "1";
  const recommendFitContext = parseRecommendFitContext(sp);

  const headerStore = await headers();
  const pricing = resolvePricingContext({
    headerCountry: headerStore.get("x-vercel-ip-country"),
    queryCountry: searchParamString(sp, "country"),
    nodeEnv: process.env.NODE_ENV,
  });

  const rawg = await getRawgGame(title);
  const gameId = rawg?.id;

  const settled = await Promise.allSettled([
    lookupBestPrice({
      title,
      pricing,
      debug: pricingDebug,
      debugLabel: `page:/game/${slug}:bestPrice`,
    }),
    lookupDeals({
      title,
      pricing,
      limit: 5,
      debug: pricingDebug,
      debugLabel: `page:/game/${slug}:deals`,
      rawgStores: rawg?.stores,
    }),
  ]);

  const bestPrice =
    settled[0].status === "fulfilled" ? settled[0].value : null;
  const dealsLookup =
    settled[1].status === "fulfilled"
      ? settled[1].value
      : { deals: [], lastCheckedAt: null, fromCache: false };
  const deals = dealsLookup.deals;
  const dealsLastCheckedAt = dealsLookup.lastCheckedAt;

  const { screenshots, movies } = await getRawgGameMedia({
    title,
    gameId,
    rawgPayload: rawg,
  });

  const {
    primaryDeal,
    otherTrustedDeals,
    trustedOffers,
    untrustedDeals: untrustedAcceptedDeals,
  } = await buildUnifiedTrustedVerifiedOffers({
    requestedTitle: title,
    displayDeals: deals,
    bestPrice,
    pricing,
    debug: pricingDebug,
    debugLabel: `page:/game/${slug}:unified`,
  });

  const primaryUsdFallback = primaryDeal
    ? isCheapSharkUsdFallbackProvider(primaryDeal.provider)
    : isCheapSharkUsdFallbackProvider(bestPrice?.provider);

  const primaryTrustedBuyUrl =
    primaryDeal?.deal.url?.trim() ? primaryDeal.deal.url.trim() : undefined;

  const freeToPlay = await resolveGameDetailFreeToPlay({
    title,
    rawg,
    trustedOffers,
  });
  const pricingMode: PricingUiMode = freeToPlay.isFreeToPlay
    ? "free_to_play"
    : derivePricingUiMode(bestPrice, rawg);
  const freeToPlayStoreUrl = freeToPlay.storeUrl?.trim() || undefined;

  const hasTrustedVerifiedBuy = Boolean(primaryTrustedBuyUrl);
  const showEstimatedPriceNoStoreLinks =
    pricingMode === "verified_price" &&
    !primaryDeal &&
    trustedOffers.length === 0 &&
    hasVerifiedAggregatorPrice(bestPrice) &&
    deals.length === 0;

  const hasVerifiedStoreListings =
    trustedOffers.length > 0 || showEstimatedPriceNoStoreLinks;

  const showSplitPrimaryLayout = Boolean(primaryDeal);

  const trackBaselinePrice = (() => {
    if (primaryDeal) {
      const n = parseVerifiedDealSalePrice(primaryDeal);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    const p = (bestPrice?.price ?? "").trim();
    if (!p || p === "N/A") return null;
    const n = Number(p.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  const trackPricingCountry = pricing.countryCode;

  const trackOfferSnapshot: TrackPriceOfferSnapshot = (() => {
    if (primaryDeal) {
      return {
        currency: primaryDeal.currency ?? null,
        provider: primaryDeal.provider ?? null,
        storeName: primaryDeal.store.name ?? null,
        url: primaryDeal.deal.url?.trim() || null,
      };
    }
    if (bestPrice?.price && bestPrice.price !== "N/A") {
      return {
        currency: bestPrice.currency ?? null,
        provider: bestPrice.provider ?? null,
        storeName: bestPrice.store?.name ?? null,
        url: bestPrice.deal?.url?.trim() || null,
      };
    }
    return {
      currency: null,
      provider: null,
      storeName: null,
      url: primaryTrustedBuyUrl ?? null,
    };
  })();

  const sidebarShowsPriceFigure =
    pricingMode === "free_to_play" ||
    Boolean(hasTrustedVerifiedBuy && primaryDeal) ||
    Boolean(showEstimatedPriceNoStoreLinks && bestPrice) ||
    (pricingMode === "verified_price" &&
      Boolean(bestPrice?.price && bestPrice.price !== "N/A"));

  const sidebarIsGenericUnavailable =
    !sidebarShowsPriceFigure &&
    pricingMode !== "verified_price" &&
    !hasVerifiedStoreListings &&
    pricingMode !== "likely_console_or_unsupported";

  const heroImage = rawg?.background_image || screenshots[0]?.image;
  const trailer = movies[0]?.data?.max || movies[0]?.data?.["480"];
  const trailerPoster = movies[0]?.preview || heroImage;
  const description =
    rawg?.description_raw ||
    "No official description available for this game yet.";

  const genres = rawg?.genres?.map((g) => g.name).join(", ");
  const audienceLine = recommendFitContext?.matchNote
    ? recommendFitContext.matchNote
    : catalogAudienceLine(genres);
  const platforms = rawg?.platforms
    ?.slice(0, 8)
    .map((p) => p.platform.name)
    .join(", ");
  const developers = rawg?.developers?.map((d) => d.name).join(", ");
  const publishers = rawg?.publishers?.map((p) => p.name).join(", ");
  const releaseDateDisplay = formatDisplayDate(rawg?.released) ?? "N/A";

  const displayTitle = rawg?.name?.trim() || titleCaseFromSlug(title);
  const curatedCollections = findCuratedCollectionsForGame(displayTitle);
  const curatedCollection = curatedCollections[0] ?? null;
  const breadcrumbs = buildGameBreadcrumbs(displayTitle, curatedCollections);
  const relatedGames = getSemanticRelatedGames({
    currentTitle: displayTitle,
    genreNames: rawg?.genres?.map((g) => g.name),
    limit: 4,
  });

  const schemaOffer = (() => {
    if (primaryDeal) {
      const price = parseVerifiedDealSalePrice(primaryDeal);
      const currency = primaryDeal.currency?.trim();
      if (Number.isFinite(price) && price >= 0 && currency) {
        return { price, priceCurrency: currency };
      }
    }
    if (hasTrustedVerifiedBuy && bestPrice?.price && bestPrice.currency?.trim()) {
      const price = parsePriceAmount(bestPrice.price);
      if (price !== null && price >= 0) {
        return { price, priceCurrency: bestPrice.currency.trim() };
      }
    }
    return null;
  })();

  const viewData = buildGameDetailViewData({
    title,
    displayTitle,
    breadcrumbs,
    rawg,
    description,
    heroImage,
    trailerUrl: trailer,
    trailerPoster,
    screenshots,
    audienceLine,
    recommendFitContext,
    pricingMode,
    freeToPlayStoreUrl,
    bestPrice,
    primaryDeal,
    otherTrustedDeals,
    trustedOffers,
    untrustedDeals: untrustedAcceptedDeals,
    dealsLastCheckedAt,
    hasTrustedVerifiedBuy,
    hasVerifiedStoreListings,
    showSplitPrimaryLayout,
    showEstimatedPriceNoStoreLinks,
    primaryUsdFallback,
    primaryTrustedBuyUrl,
    sidebarShowsPriceFigure,
    sidebarIsGenericUnavailable,
    releaseDateDisplay,
    genres,
    platforms,
    developers,
    publishers,
    curatedCollection,
    relatedGames,
  });

  return (
    <AppPageShell>
      <GameStructuredData
        data={{
          name: displayTitle,
          description,
          image: heroImage ?? findDirectoryGameImage(displayTitle),
          genres: rawg?.genres?.map((g) => g.name),
          developers: rawg?.developers?.map((d) => d.name),
          publishers: rawg?.publishers?.map((p) => p.name),
          released: rawg?.released ?? null,
          rating: rawg?.rating ?? null,
          ratingCount: rawg?.ratings_count ?? null,
          platforms: rawg?.platforms?.map((p) => p.platform.name),
          path: gameDetailPath(title),
          breadcrumbs,
          offer: schemaOffer,
        }}
      />
      {gameId ? (
        <GamePageAnalytics title={displayTitle} rawgId={gameId} />
      ) : null}
      <div className="gp-game-page-enter relative z-10">
      <GameDetailView
        data={viewData}
        theme="light"
        fitSlot={
          recommendFitContext ? undefined : (
            <PersonalGameFitCard gameSlug={title} rawgId={gameId} />
          )
        }
        trackPriceSlot={
          <TrackPriceButton
            title={rawg?.name || title}
            rawgId={rawg?.id ?? null}
            baselinePrice={trackBaselinePrice}
            pricingCountry={trackPricingCountry}
            offerSnapshot={trackOfferSnapshot}
          />
        }
        showExploreSection
      />
      </div>
    </AppPageShell>
  );
}
