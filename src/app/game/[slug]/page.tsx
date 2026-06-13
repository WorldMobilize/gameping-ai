import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import { gameDetailPath } from "@/lib/curated/game-links";
import {
  buildGameBreadcrumbs,
  buildGamePageMetadata,
  findCuratedCollectionsForGame,
  findDirectoryGameImage,
  getSemanticRelatedGames,
  titleCaseFromSlug,
} from "@/lib/seo/game-page";
import GameBreadcrumbs from "@/components/GameBreadcrumbs";
import GameStructuredData from "@/components/GameStructuredData";
import GamePageAnalytics from "@/components/GamePageAnalytics";
import GameScreenshotLightbox from "@/components/GameScreenshotLightbox";
import TrackPriceButton, {
  type TrackPriceOfferSnapshot,
} from "@/components/TrackPriceButton";
import { getCachedRawgGame, setCachedRawgGame } from "@/lib/cache";
import { resolveGameDetailFreeToPlay } from "@/lib/game-detail-free-to-play";
import { getRawgGameMedia } from "@/lib/rawg-game-media-cache";
import {
  AGGREGATOR_PRICE_DISCLAIMER,
  formatDealsLastCheckedLabel,
  formatPriceLine,
  isCheapSharkUsdFallbackProvider,
} from "@/lib/pricing/display";
import { resolvePricingContext } from "@/lib/pricing/pricing-context";
import type { BestPriceResult, VerifiedDealRow } from "@/lib/pricing/price-service";
import {
  buildUnifiedTrustedVerifiedOffers,
  lookupBestPrice,
  lookupDeals,
  parseVerifiedDealSalePrice,
} from "@/lib/pricing/price-service";
import { verifiedDealDisplayDedupeKey } from "@/lib/pricing/verified-deal-row";
import { formatDisplayDate } from "@/lib/format-display-date";
import PersonalGameFitCard from "@/components/PersonalGameFitCard";
import {
  RECOMMEND_FIT_TRANSPARENCY_NOTE,
  resolveRecommendFitBody,
  sanitizeRecommendFitCopy,
} from "@/lib/recommend-fit-display";

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

const NO_VERIFIED_DEAL_TITLE = "No verified deal yet";
const NO_VERIFIED_DEAL_BODY =
  "We couldn't confirm a reliable current price from our supported stores.";
const NO_VERIFIED_DEAL_HELPER =
  "Check the store page or track this game to catch future drops.";

const FREE_TO_PLAY_TITLE = "Free to play";
const FREE_TO_PLAY_BODY =
  "This game appears to be free to play on supported stores.";

function FreeToPlayPricingState({ storeUrl }: { storeUrl?: string }) {
  return (
    <>
      <p className="text-lg font-semibold leading-snug text-white/75">
        {FREE_TO_PLAY_TITLE}
      </p>
      <p className="text-xs leading-relaxed text-white/50">{FREE_TO_PLAY_BODY}</p>
      {storeUrl ? (
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex rounded-full border border-cyan-400/35 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-200 transition hover:bg-cyan-400/20"
        >
          View store page
        </a>
      ) : null}
    </>
  );
}

function PricingUnavailableState({
  variant = "default",
}: {
  variant?: "default" | "console";
}) {
  return (
    <>
      <p className="text-lg font-semibold leading-snug text-white/75">
        {NO_VERIFIED_DEAL_TITLE}
      </p>
      <p className="text-xs leading-relaxed text-white/50">
        {variant === "console"
          ? "Verified PC store pricing may not be available for this platform."
          : NO_VERIFIED_DEAL_BODY}
      </p>
      {variant === "default" ? (
        <p className="text-xs leading-relaxed text-white/40">{NO_VERIFIED_DEAL_HELPER}</p>
      ) : null}
    </>
  );
}

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

function recommendMatchTierLabel(tier: RecommendFitContext["matchTier"]): string | null {
  if (tier === "best_match") return "Best match";
  if (tier === "good_alternative") return "Good alternative";
  if (tier === "partial_match") return "Partial match";
  return null;
}

function RecommendContextFitCard({ context }: { context: RecommendFitContext }) {
  const tierLabel = recommendMatchTierLabel(context.matchTier);
  const fitBody = resolveRecommendFitBody(context.reason);
  const matchNote = sanitizeRecommendFitCopy(context.matchNote);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0b14]/60 p-7 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
        From your search
      </p>
      <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">
        Why this fits your vibe
      </h2>

      {(tierLabel || context.match !== undefined) && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {tierLabel ? (
            <span
              className={
                context.matchTier === "best_match"
                  ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/25"
                  : context.matchTier === "good_alternative"
                    ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-500/25"
                    : "rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-200 ring-1 ring-orange-500/25"
              }
            >
              {tierLabel}
            </span>
          ) : null}
          {context.match !== undefined ? (
            <span className="rounded-full bg-cyan-400/12 px-3 py-1 text-sm font-bold tabular-nums text-cyan-200 ring-1 ring-cyan-400/20">
              {context.match}% match
            </span>
          ) : null}
        </div>
      )}

      {matchNote ? (
        <p className="mt-4 text-sm leading-6 text-white/50">{matchNote}</p>
      ) : null}

      <p className="mt-5 text-lg leading-8 text-white/70">{fitBody}</p>

      <p className="mt-6 text-xs text-white/35">{RECOMMEND_FIT_TRANSPARENCY_NOTE}</p>
    </div>
  );
}

function PersonalFitSection({
  context,
  gameSlug,
  rawgId,
}: {
  context: RecommendFitContext | null;
  gameSlug: string;
  rawgId?: number | null;
}) {
  if (context) {
    return <RecommendContextFitCard context={context} />;
  }

  return <PersonalGameFitCard gameSlug={gameSlug} rawgId={rawgId} />;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-white/10 py-4">
      <span className="text-sm text-white/45">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-bold text-white/85">
        {value || "N/A"}
      </span>
    </div>
  );
}

function formatGameDetailPriceLine(params: {
  price: string;
  currency?: string | null;
  provider?: string | null;
}) {
  return formatPriceLine({
    price: params.price,
    currency: params.currency,
    usdFallback: isCheapSharkUsdFallbackProvider(params.provider),
  });
}

function VerifiedStoreDealCard({
  deal,
  buyLabel,
}: {
  deal: VerifiedDealRow;
  buyLabel?: string;
}) {
  return (
    <div className="grid items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 md:grid-cols-[1fr_auto_auto]">
      <div>
        <p className="font-black">{deal.store.name || "Store"}</p>
        <p className="text-xs text-white/35">Matched listing: {deal.matchedTitle}</p>
        <p className="text-sm text-white/45">
          Normal:{" "}
          {formatGameDetailPriceLine({
            price: deal.normalPrice,
            currency: deal.currency,
            provider: deal.provider,
          })}
        </p>
      </div>

      <p className="text-2xl font-black text-cyan-300">
        {formatGameDetailPriceLine({
          price: deal.salePrice,
          currency: deal.currency,
          provider: deal.provider,
        })}
      </p>

      {deal.deal.url ? (
        <a
          href={deal.deal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-black transition hover:bg-cyan-100"
        >
          {buyLabel ?? "Buy"}
        </a>
      ) : (
        <span className="text-center text-sm text-white/45">No verified store link</span>
      )}
    </div>
  );
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
    (hasTrustedVerifiedBuy && primaryDeal) ||
    (showEstimatedPriceNoStoreLinks && bestPrice) ||
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

  return (
    <main className="gp-game-page-enter min-h-screen bg-[#05060f] text-white">
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
      <Navbar />

      <section className="relative overflow-hidden pb-10">
        {heroImage && (
          <img
            src={heroImage}
            alt={rawg?.name || title}
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-sm"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-[#05060f]/80 to-[#05060f]" />
        <div className="pointer-events-none absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/8 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
          <GameBreadcrumbs items={breadcrumbs} />

          <div className="grid gap-10 pt-10 pb-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="mb-5 text-sm uppercase tracking-[0.45em] text-cyan-300">
                GamePing pick
              </p>

              <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">
                {rawg?.name || title}
              </h1>

              <p className="mt-6 max-w-2xl text-xl leading-9 text-white/75">
                {description.slice(0, 460)}
                {description.length > 460 ? "..." : ""}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {rawg?.genres?.slice(0, 6).map((genre) => (
                  <span
                    key={genre.name}
                    className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200 backdrop-blur"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                {pricingMode === "free_to_play" && freeToPlayStoreUrl ? (
                  <a
                    href={freeToPlayStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-cyan-400 px-8 py-4 text-base font-bold text-black transition hover:-translate-y-0.5 hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    View store page
                  </a>
                ) : pricingMode === "free_to_play" ? (
                  <span className="rounded-full bg-white/10 px-8 py-4 font-bold text-white/60">
                    {FREE_TO_PLAY_TITLE}
                  </span>
                ) : hasTrustedVerifiedBuy ? (
                  <a
                    href={primaryTrustedBuyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-cyan-400 px-8 py-4 text-base font-bold text-black transition hover:-translate-y-0.5 hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    {primaryDeal
                      ? `Buy on ${primaryDeal.store.name || "store"}`
                      : `Buy on ${bestPrice?.store?.name || "store"}`}
                  </a>
                ) : pricingMode === "verified_price" && hasVerifiedStoreListings ? (
                  <a
                    href="#verified-store-deals"
                    className="rounded-full bg-cyan-400 px-8 py-4 text-base font-bold text-black transition hover:-translate-y-0.5 hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    Compare verified listings
                  </a>
                ) : pricingMode === "verified_price" ? (
                  <span className="rounded-full bg-white/10 px-8 py-4 font-bold text-white/55">
                    No active verified deals right now.
                  </span>
                ) : pricingMode === "likely_console_or_unsupported" ? (
                  <span className="rounded-full bg-white/10 px-8 py-4 font-bold text-white/55">
                    Pricing support limited for this platform
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-8 py-4 font-bold text-white/55">
                    No verified deal yet
                  </span>
                )}

                {trailer && (
                  <a
                    href="#trailer"
                    className="rounded-full border border-white/15 bg-white/5 px-8 py-4 font-bold text-white/80 backdrop-blur transition hover:border-purple-400/60 hover:text-purple-200"
                  >
                    ▶ Watch trailer
                  </a>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b14]/80 shadow-lg shadow-black/25">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={rawg?.name || title}
                    className="h-[450px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[450px] items-center justify-center bg-black/40 text-white/40">
                    No image available
                  </div>
                )}

                <div className="p-6">
                  <div className="flex flex-col gap-3">
                    <div className="rounded-2xl bg-black/30 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        {hasTrustedVerifiedBuy
                          ? "Best verified store price"
                          : "Estimated aggregator price"}
                      </p>
                      <div className="mt-2 flex flex-col gap-2">
                        {pricingMode === "free_to_play" ? (
                          <FreeToPlayPricingState storeUrl={freeToPlayStoreUrl} />
                        ) : hasTrustedVerifiedBuy && primaryDeal ? (
                          <>
                            <p className="text-2xl font-black text-cyan-300">
                              {formatGameDetailPriceLine({
                                price: primaryDeal.salePrice,
                                currency: primaryDeal.currency,
                                provider: primaryDeal.provider,
                              })}
                            </p>
                            <p className="text-xs leading-relaxed text-white/45">
                              {primaryDeal.store.name || "Store"} · {primaryDeal.matchedTitle}
                            </p>
                            {primaryUsdFallback ? (
                              <p className="text-xs text-white/35">{AGGREGATOR_PRICE_DISCLAIMER}</p>
                            ) : null}
                          </>
                        ) : showEstimatedPriceNoStoreLinks && bestPrice ? (
                          <>
                            <p className="text-2xl font-black text-cyan-300">
                              Estimated price found
                            </p>
                            <p className="text-xs leading-relaxed text-white/45">
                              Indicative match only — no additional verified store rows passed title
                              safety checks.
                            </p>
                          </>
                        ) : pricingMode === "verified_price" && bestPrice ? (
                          <>
                            <p className="text-2xl font-black text-cyan-300">
                              {formatGameDetailPriceLine({
                                price: bestPrice.price,
                                currency: bestPrice.currency,
                                provider: bestPrice.provider,
                              })}
                            </p>
                            {primaryUsdFallback ? (
                              <p className="text-xs text-white/40">{AGGREGATOR_PRICE_DISCLAIMER}</p>
                            ) : null}
                          </>
                        ) : pricingMode === "likely_console_or_unsupported" ? (
                          <PricingUnavailableState variant="console" />
                        ) : (
                          <PricingUnavailableState />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/30 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                          Rating
                        </p>
                        <p className="text-lg font-black leading-none text-yellow-300 sm:text-xl">
                          {rawg?.rating ? `${rawg.rating}/5` : "N/A"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/30 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                          Metacritic
                        </p>
                        <p className="text-lg font-black leading-none text-green-300 sm:text-xl">
                          {rawg?.metacritic || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-white/60">{audienceLine}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Rating
            </p>
            <p className="mt-3 text-3xl font-black text-yellow-300">
              {rawg?.rating ? `${rawg.rating}/5` : "N/A"}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Release
            </p>
            <p className="mt-3 text-2xl font-black text-white">
              {releaseDateDisplay}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Genres
            </p>
            <p className="mt-3 text-lg font-bold text-cyan-300">
              {genres || "N/A"}
            </p>
          </div>

          <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
              {recommendFitContext ? "From your search" : "Catalog note"}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/75">{audienceLine}</p>
          </div>
        </div>
      </section>

      {trailer && (
        <section id="trailer" className="mx-auto max-w-7xl px-6 pb-14">
          <p className="text-sm uppercase tracking-[0.35em] text-purple-300">
            Official media
          </p>
          <h2 className="mt-3 text-4xl font-black">Trailer</h2>

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
            <video
              src={trailer}
              controls
              poster={trailerPoster}
              className="aspect-video w-full bg-black object-cover"
            />
          </div>
        </section>
      )}

      {screenshots.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-12">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
            Gallery
          </p>
          <h2 className="mt-3 text-4xl font-black">Screenshots</h2>

          <GameScreenshotLightbox
            screenshots={screenshots}
            gameTitle={rawg?.name || title}
          />
        </section>
      )}

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-20 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              Overview
            </p>
            <h2 className="mt-4 text-3xl font-black">About this game</h2>
            <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white/70">
              {description}
            </p>
          </div>

          <PersonalFitSection
            context={recommendFitContext}
            gameSlug={title}
            rawgId={gameId}
          />

          <div
            id="verified-store-deals"
            className="scroll-mt-24 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7"
          >
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              Store comparison
            </p>
            <h2 className="mt-4 text-3xl font-black">Verified store deals</h2>
            <p className="mt-2 text-sm text-white/45">{AGGREGATOR_PRICE_DISCLAIMER}</p>
            {dealsLastCheckedAt ? (
              <p className="mt-2 text-xs text-white/40">
                {formatDealsLastCheckedLabel(dealsLastCheckedAt)}
              </p>
            ) : null}

            {pricingMode === "free_to_play" ? (
              <div className="mt-6">
                <p className="text-lg font-semibold text-white/75">{FREE_TO_PLAY_TITLE}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{FREE_TO_PLAY_BODY}</p>
                {freeToPlayStoreUrl ? (
                  <a
                    href={freeToPlayStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex rounded-full border border-cyan-400/35 bg-cyan-400/10 px-5 py-2.5 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/20"
                  >
                    View store page
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 space-y-8">
                {showSplitPrimaryLayout && (
                  <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-6">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200/90">
                      Best verified price
                    </p>
                    <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-4xl font-black text-white">
                          {primaryDeal
                            ? formatGameDetailPriceLine({
                                price: primaryDeal.salePrice,
                                currency: primaryDeal.currency,
                                provider: primaryDeal.provider,
                              })
                            : bestPrice
                              ? formatGameDetailPriceLine({
                                  price: bestPrice.price,
                                  currency: bestPrice.currency,
                                  provider: bestPrice.provider,
                                })
                              : ""}
                        </p>
                        <p className="mt-2 text-sm text-white/50">
                          {primaryDeal
                            ? `${primaryDeal.store.name || "Store"} · ${primaryDeal.matchedTitle}`
                            : bestPrice
                              ? `${bestPrice.store?.name || "Store"} · ${bestPrice.matchedTitle ?? title}`
                              : ""}
                        </p>
                        {primaryUsdFallback ? (
                          <p className="mt-2 text-xs text-white/45">{AGGREGATOR_PRICE_DISCLAIMER}</p>
                        ) : null}
                      </div>
                      {primaryTrustedBuyUrl ? (
                        <a
                          href={primaryTrustedBuyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-8 py-4 text-base font-black text-black shadow-[0_0_24px_rgba(255,255,255,0.12)] transition hover:bg-cyan-100"
                        >
                          Buy now
                        </a>
                      ) : null}
                    </div>
                  </div>
                )}

                {showEstimatedPriceNoStoreLinks && bestPrice && (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-lg font-black text-white/90">Estimated price found</p>
                    <p className="mt-2 text-sm leading-6 text-white/55">
                      We found an indicative price, but no additional verified store deal rows met our
                      title safety checks right now.
                    </p>
                  </div>
                )}

                {otherTrustedDeals.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-[0.28em] text-white/50">
                      Other verified stores
                    </h3>
                    {otherTrustedDeals.map((deal) => (
                      <VerifiedStoreDealCard
                        key={verifiedDealDisplayDedupeKey(deal)}
                        deal={deal}
                      />
                    ))}
                  </div>
                )}

                {!showSplitPrimaryLayout && trustedOffers.length > 0 && (
                  <div className="space-y-3">
                    {trustedOffers.map((deal) => (
                      <VerifiedStoreDealCard
                        key={verifiedDealDisplayDedupeKey(deal)}
                        deal={deal}
                      />
                    ))}
                  </div>
                )}

                {untrustedAcceptedDeals.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-[0.28em] text-white/50">
                      Listings without a verified buy link
                    </h3>
                    {untrustedAcceptedDeals.map((deal) => (
                      <VerifiedStoreDealCard key={deal.deal.id} deal={deal} />
                    ))}
                  </div>
                )}

                {!showSplitPrimaryLayout &&
                  trustedOffers.length === 0 &&
                  !showEstimatedPriceNoStoreLinks && (
                    <p className="text-white/55">
                      {pricingMode === "verified_price"
                        ? "No active verified deals right now."
                        : pricingMode === "likely_console_or_unsupported"
                          ? "Verified PC store deals may not be listed for this platform."
                          : NO_VERIFIED_DEAL_BODY}
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              Game info
            </p>

            <div className="mt-5">
              <DetailRow label="Release date" value={releaseDateDisplay} />
              <DetailRow label="Genres" value={genres} />
              <DetailRow label="Platforms" value={platforms} />
              <DetailRow label="Developer" value={developers} />
              <DetailRow label="Publisher" value={publishers} />
              <DetailRow label="ESRB" value={rawg?.esrb_rating?.name} />
              <DetailRow
                label="RAWG rating"
                value={rawg?.rating ? `${rawg.rating}/5` : null}
              />
              <DetailRow label="Metacritic" value={rawg?.metacritic} />
            </div>
          </div>

          <div
            className={`sticky top-6 rounded-[2rem] border p-7 ${
              sidebarShowsPriceFigure
                ? "border-cyan-400/20 bg-cyan-400/10"
                : "border-white/10 bg-white/[0.04]"
            }`}
          >
            <p
              className={`text-sm uppercase tracking-[0.35em] ${
                sidebarShowsPriceFigure ? "text-cyan-200" : "text-white/40"
              }`}
            >
              {hasTrustedVerifiedBuy ? "Best verified store price" : "Estimated aggregator price"}
            </p>
            <h2
              className={`mt-4 ${
                sidebarShowsPriceFigure
                  ? "text-4xl font-black"
                  : "text-xl font-semibold text-white/75"
              }`}
            >
              {pricingMode === "free_to_play"
                ? FREE_TO_PLAY_TITLE
                : hasTrustedVerifiedBuy && primaryDeal
                  ? formatGameDetailPriceLine({
                      price: primaryDeal.salePrice,
                      currency: primaryDeal.currency,
                      provider: primaryDeal.provider,
                    })
                  : showEstimatedPriceNoStoreLinks && bestPrice
                    ? "Estimated price found"
                    : pricingMode === "verified_price" &&
                        bestPrice?.price &&
                        bestPrice.price !== "N/A"
                      ? formatGameDetailPriceLine({
                          price: bestPrice.price,
                          currency: bestPrice.currency,
                          provider: bestPrice.provider,
                        })
                      : NO_VERIFIED_DEAL_TITLE}
            </h2>
            {primaryUsdFallback ? (
              <p className="mt-2 text-xs text-white/45">{AGGREGATOR_PRICE_DISCLAIMER}</p>
            ) : null}
            <p
              className={`mt-4 leading-relaxed ${
                sidebarShowsPriceFigure ? "text-white/65" : "text-sm text-white/50"
              }`}
            >
              {pricingMode === "free_to_play"
                ? FREE_TO_PLAY_BODY
                : hasTrustedVerifiedBuy && primaryDeal
                  ? `Trusted store link — ${primaryDeal.store.name || "Store"}. Other offers are listed below when available.`
                  : showEstimatedPriceNoStoreLinks
                    ? "Indicative price only — no trusted store buy link from supported providers right now."
                    : pricingMode === "verified_price" &&
                        bestPrice?.price &&
                        bestPrice.price !== "N/A"
                      ? `Indicative only — ${bestPrice.provider}. Purchases use verified store rows below.`
                      : pricingMode === "verified_price"
                        ? "No active verified deals right now."
                        : hasVerifiedStoreListings
                          ? "Aggregator estimate unavailable; verified prices are listed in store comparison."
                          : pricingMode === "likely_console_or_unsupported"
                            ? "Verified PC store pricing may not be available for this platform."
                            : NO_VERIFIED_DEAL_BODY}
            </p>
            {pricingMode === "free_to_play" && freeToPlayStoreUrl ? (
              <a
                href={freeToPlayStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full border border-cyan-400/35 bg-cyan-400/10 px-5 py-2.5 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/20"
              >
                View store page
              </a>
            ) : null}
            {sidebarIsGenericUnavailable ? (
              <p className="mt-2 text-xs leading-relaxed text-white/40">{NO_VERIFIED_DEAL_HELPER}</p>
            ) : null}

            <TrackPriceButton
              title={rawg?.name || title}
              rawgId={rawg?.id ?? null}
              baselinePrice={trackBaselinePrice}
              pricingCountry={trackPricingCountry}
              offerSnapshot={trackOfferSnapshot}
            />
          </div>
        </aside>
      </section>

      <section
        className="mx-auto max-w-7xl border-t border-white/10 px-6 pb-14 pt-10"
        aria-labelledby="game-detail-explore-heading"
      >
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-8 md:px-10">
          <h2
            id="game-detail-explore-heading"
            className="text-xs font-black uppercase tracking-[0.35em] text-white/40"
          >
            Continue exploring
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            Jump back into discovery whenever you are ready—browse the directory, scan curated
            angles, or describe what you want next.
          </p>

          {curatedCollection ? (
            <p className="mt-5 text-sm text-white/55">
              Featured in{" "}
              <Link
                href={`/curated/${curatedCollection.slug}`}
                className="font-bold text-cyan-300 underline-offset-4 hover:underline"
              >
                {curatedCollection.h1}
              </Link>
              .
            </p>
          ) : null}

          {relatedGames.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-sm font-black text-white/80">Similar games to explore</h3>
              <ul className="mt-3 flex flex-wrap gap-3">
                {relatedGames.map((game) => (
                  <li key={game.title}>
                    <Link
                      href={gameDetailPath(game.title)}
                      className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/80 transition hover:border-cyan-400/40 hover:text-cyan-200"
                    >
                      {game.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <ul className="mt-6 flex flex-col gap-3 text-sm font-bold sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-2">
            <li>
              <Link
                href="/games"
                className="text-cyan-300/90 underline-offset-4 transition hover:text-cyan-200 hover:underline"
              >
                Browse games A–Z
              </Link>
            </li>
            <li>
              <Link
                href="/curated"
                className="text-cyan-300/90 underline-offset-4 transition hover:text-cyan-200 hover:underline"
              >
                Explore curated lists
              </Link>
            </li>
            <li>
              <Link
                href="/recommend"
                className="text-cyan-300/90 underline-offset-4 transition hover:text-cyan-200 hover:underline"
              >
                Try AI recommendations
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}