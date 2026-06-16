import type { BestPriceResult, VerifiedDealRow } from "@/lib/pricing/price-service";
import { verifiedDealDisplayDedupeKey } from "@/lib/pricing/verified-deal-row";
import { isCheapSharkUsdFallbackProvider } from "@/lib/pricing/display";
import { formatDealsLastCheckedLabel, formatPriceLine } from "@/lib/pricing/display";
import { AGGREGATOR_PRICE_DISCLAIMER } from "@/lib/pricing/display";
import { RECOMMEND_FIT_TRANSPARENCY_NOTE } from "@/lib/recommend-fit-display";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";
import type {
  GameDetailPricingMode,
  GameDetailVerifiedDealView,
  GameDetailViewData,
} from "@/components/game/game-detail-view-types";

const NO_VERIFIED_DEAL_TITLE = "No verified deal yet";
const NO_VERIFIED_DEAL_BODY =
  "We couldn't confirm a reliable current price from our supported stores.";
const NO_VERIFIED_DEAL_HELPER =
  "Check the store page or track this game to catch future drops.";
const FREE_TO_PLAY_TITLE = "Free to play";
const FREE_TO_PLAY_BODY =
  "This game appears to be free to play on supported stores.";

type RawgGameSlice = {
  name?: string;
  rating?: number;
  metacritic?: number;
  released?: string;
  genres?: { name: string }[];
  platforms?: { platform: { name: string } }[];
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

function mapDeal(deal: VerifiedDealRow): GameDetailVerifiedDealView {
  return {
    id: verifiedDealDisplayDedupeKey(deal),
    storeName: deal.store.name || "Store",
    matchedTitle: deal.matchedTitle,
    normalPrice: formatGameDetailPriceLine({
      price: deal.normalPrice,
      currency: deal.currency,
      provider: deal.provider,
    }),
    salePrice: formatGameDetailPriceLine({
      price: deal.salePrice,
      currency: deal.currency,
      provider: deal.provider,
    }),
    currency: deal.currency,
    provider: deal.provider,
    buyUrl: deal.deal.url?.trim() || null,
  };
}

export function buildGameDetailViewData(params: {
  title: string;
  displayTitle: string;
  breadcrumbs: GameBreadcrumbItem[];
  rawg: RawgGameSlice | null;
  description: string;
  heroImage?: string | null;
  trailerUrl?: string;
  trailerPoster?: string;
  screenshots: Array<{ id: number; image: string }>;
  audienceLine: string;
  recommendFitContext: RecommendFitContext | null;
  pricingMode: GameDetailPricingMode;
  freeToPlayStoreUrl?: string;
  bestPrice: BestPriceResult | null;
  primaryDeal: VerifiedDealRow | null | undefined;
  otherTrustedDeals: VerifiedDealRow[];
  trustedOffers: VerifiedDealRow[];
  untrustedDeals: VerifiedDealRow[];
  dealsLastCheckedAt: string | null;
  hasTrustedVerifiedBuy: boolean;
  hasVerifiedStoreListings: boolean;
  showSplitPrimaryLayout: boolean;
  showEstimatedPriceNoStoreLinks: boolean;
  primaryUsdFallback: boolean;
  primaryTrustedBuyUrl?: string;
  sidebarShowsPriceFigure: boolean;
  sidebarIsGenericUnavailable: boolean;
  releaseDateDisplay: string;
  genres?: string;
  platforms?: string;
  developers?: string;
  publishers?: string;
  curatedCollection?: { slug: string; h1: string } | null;
  relatedGames?: Array<{ title: string }>;
}): GameDetailViewData {
  const {
    displayTitle,
    rawg,
    pricingMode,
    bestPrice,
    primaryDeal,
    hasTrustedVerifiedBuy,
    showEstimatedPriceNoStoreLinks,
    sidebarShowsPriceFigure,
    sidebarIsGenericUnavailable,
  } = params;

  const sidebarPriceValue =
    pricingMode === "free_to_play"
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
            : NO_VERIFIED_DEAL_TITLE;

  const sidebarPriceBody =
    pricingMode === "free_to_play"
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
              : params.hasVerifiedStoreListings
                ? "Aggregator estimate unavailable; verified prices are listed in store comparison."
                : pricingMode === "likely_console_or_unsupported"
                  ? "Verified PC store pricing may not be available for this platform."
                  : NO_VERIFIED_DEAL_BODY;

  return {
    title: displayTitle,
    breadcrumbs: params.breadcrumbs,
    description: params.description,
    heroImage: params.heroImage,
    genres: rawg?.genres?.map((g) => g.name) ?? [],
    ratingDisplay: rawg?.rating ? `${rawg.rating}/5` : "N/A",
    metacriticDisplay: rawg?.metacritic ? String(rawg.metacritic) : "N/A",
    releaseDateDisplay: params.releaseDateDisplay,
    genresLine: params.genres || "N/A",
    platforms: params.platforms,
    developers: params.developers,
    publishers: params.publishers,
    esrb: rawg?.esrb_rating?.name,
    audienceLine: params.audienceLine,
    audienceLabel: params.recommendFitContext ? "From your search" : "Catalog note",

    pricingMode: params.pricingMode,
    hasTrustedVerifiedBuy: params.hasTrustedVerifiedBuy,
    hasVerifiedStoreListings: params.hasVerifiedStoreListings,
    showSplitPrimaryLayout: params.showSplitPrimaryLayout,
    showEstimatedPriceNoStoreLinks: params.showEstimatedPriceNoStoreLinks,
    primaryUsdFallback: params.primaryUsdFallback,
    freeToPlayStoreUrl: params.freeToPlayStoreUrl,
    primaryTrustedBuyUrl: params.primaryTrustedBuyUrl,
    primaryDeal: primaryDeal ? mapDeal(primaryDeal) : null,
    bestPrice:
      bestPrice?.price && bestPrice.price !== "N/A"
        ? {
            displayPrice: formatGameDetailPriceLine({
              price: bestPrice.price,
              currency: bestPrice.currency,
              provider: bestPrice.provider,
            }),
            storeName: bestPrice.store?.name ?? null,
            matchedTitle: bestPrice.matchedTitle ?? params.title,
          }
        : null,
    otherTrustedDeals: params.otherTrustedDeals.map(mapDeal),
    trustedOffers: params.trustedOffers.map(mapDeal),
    untrustedDeals: params.untrustedDeals.map((deal) => ({
      ...mapDeal(deal),
      id: String(deal.deal.id),
    })),
    dealsLastCheckedLabel: params.dealsLastCheckedAt
      ? formatDealsLastCheckedLabel(params.dealsLastCheckedAt) ?? undefined
      : undefined,
    priceDisclaimer: AGGREGATOR_PRICE_DISCLAIMER,

    sidebarShowsPriceFigure: params.sidebarShowsPriceFigure,
    sidebarIsGenericUnavailable: params.sidebarIsGenericUnavailable,
    sidebarPriceTitle: hasTrustedVerifiedBuy
      ? "Best verified store price"
      : "Estimated aggregator price",
    sidebarPriceValue,
    sidebarPriceBody,

    trailerUrl: params.trailerUrl,
    trailerPoster: params.trailerPoster,
    screenshots: params.screenshots,

    recommendFit: params.recommendFitContext,
    fitTransparencyNote: RECOMMEND_FIT_TRANSPARENCY_NOTE,

    curatedCollection: params.curatedCollection,
    relatedGames: params.relatedGames,
  };
}
