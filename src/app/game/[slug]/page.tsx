import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { VERIFIED_TITLE_MATCH_MIN, titleMatchQuality } from "@/lib/title-match";
import AppPageShell from "@/components/app/AppPageShell";
import { gameDetailPath } from "@/lib/curated/game-links";
import {
  buildGameBreadcrumbs,
  buildGameDisplayBreadcrumbs,
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
import GameDetailWithTheme from "@/components/game/GameDetailWithTheme";
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

/**
 * "RAWG has never heard of this game" and "RAWG did not answer" are NOT the same
 * answer, and the page must not treat them as one.
 *
 * The first deserves a 404. The second must never produce one: RAWG rate-limits and
 * has outages, and a lookup that failed for ten minutes would otherwise 404 every
 * real game page on the site — long enough for a crawler to notice and start pulling
 * them out of the index. So a failed lookup renders the page in a degraded state, as
 * it always did, and only a definitive "no match" 404s.
 */
type RawgLookup = { game: RawgGame | null; lookupFailed: boolean };

async function getRawgGame(title: string): Promise<RawgLookup> {
  const slug = encodeURIComponent(title.trim().toLowerCase());

  try {
    const cached = await getCachedRawgGame<RawgGame>(slug);
    if (cached) return { game: cached, lookupFailed: false };
  } catch {
    // Cache miss or cache down — fall through to RAWG, which is the source anyway.
  }

  try {
    const searchRes = await fetch(
      `https://api.rawg.io/api/games?key=${
        process.env.RAWG_API_KEY
      }&search=${encodeURIComponent(title)}&page_size=5`,
      { cache: "no-store" }
    );

    if (!searchRes.ok) return { game: null, lookupFailed: true };

    const searchData = (await searchRes.json()) as {
      results?: { id?: number; name?: string }[];
    };

    /* RAWG's search NEVER says "no". Ask it for "zzzqqqxxx-not-a-game" and it returns
       64,965 results, the first of which is an unrelated game — so taking results[0]
       on faith meant every made-up URL rendered a real game page for the WRONG game.
       Same title-match gate the rest of the codebase already uses (collections,
       pricing): the best candidate has to actually BE the game we asked for. */
    const best = (searchData.results ?? [])
      .filter((r): r is { id: number; name: string } =>
        typeof r?.id === "number" && typeof r?.name === "string"
      )
      .map((r) => ({ r, score: titleMatchQuality(title, r.name) }))
      .sort((a, b) => b.score - a.score)[0];

    // RAWG answered, and nothing it returned is this game. A real 404.
    if (!best || best.score < VERIFIED_TITLE_MATCH_MIN) {
      return { game: null, lookupFailed: false };
    }

    const detailRes = await fetch(
      `https://api.rawg.io/api/games/${best.r.id}?key=${process.env.RAWG_API_KEY}`,
      { cache: "no-store" }
    );

    if (!detailRes.ok) return { game: null, lookupFailed: true };

    const payload = (await detailRes.json()) as RawgGame;

    try {
      await setCachedRawgGame({ slug, title, rawgPayload: payload });
    } catch {}

    return { game: payload, lookupFailed: false };
  } catch {
    return { game: null, lookupFailed: true };
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

/**
 * The line shown when the visitor did NOT arrive from a recommendation, so there is
 * no real match to report.
 *
 * It used to read "Often clicks with {genre} fans exploring the catalog" — an
 * engagement statistic we do not have. No click data is collected anywhere in this
 * codebase, so the sentence was inventing a fact about other people's behaviour on
 * every catalog page. It now says what is actually true: the genre, and that a
 * recommendation is what personalises this.
 */
function catalogAudienceLine(genres?: string): string {
  const first = genres?.split(",")[0]?.trim();
  if (first) {
    return `A ${first.toLowerCase()} pick. Run a recommendation to see how well it fits you.`;
  }
  return "Run a recommendation to see how well this fits your taste.";
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

  const { game: rawg, lookupFailed } = await getRawgGame(title);

  /* RAWG answered and has no such game → 404, which is the truthful answer to
     "what is /game/asdfgh". Before this, ANY slug rendered a page: the URL
     title-cased, "No official description available for this game yet", and no
     data — an indexable soft-404 for every string anyone cared to type.
     A FAILED lookup is deliberately excluded: see getRawgGame. */
  if (!rawg && !lookupFailed) notFound();

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
  const breadcrumbSource = typeof sp.from === "string" ? sp.from : undefined;
  const displayBreadcrumbs = buildGameDisplayBreadcrumbs(
    displayTitle,
    curatedCollections,
    breadcrumbSource
  );
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
    breadcrumbs: displayBreadcrumbs,
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
    <AppPageShell hideAmbient>
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
      <div className="gp-accent-page relative isolate min-h-0 flex-1">
        {/* Fixed cinematic Games background — SAME image in light + dark. */}
        <div aria-hidden className="gp-games-bg" />
        <div className="gp-game-page-enter relative z-10">
        <GameDetailWithTheme
          data={viewData}
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
      </div>
    </AppPageShell>
  );
}
