import type { GameBreadcrumbItem } from "@/lib/seo/game-page";
import type { RecommendContextFitData } from "@/components/recommend/RecommendContextFitCardView";

export type GameDetailPricingMode =
  | "free_to_play"
  | "verified_price"
  | "likely_console_or_unsupported"
  | "unavailable";

export type GameDetailScreenshot = {
  id: number;
  image: string;
};

export type GameDetailVerifiedDealView = {
  id: string;
  storeName: string;
  matchedTitle: string;
  normalPrice: string;
  salePrice: string;
  currency?: string | null;
  provider?: string | null;
  buyUrl?: string | null;
  buyLabel?: string;
};

export type GameDetailViewData = {
  title: string;
  breadcrumbs: GameBreadcrumbItem[];
  description: string;
  heroImage?: string | null;
  genres: string[];
  ratingDisplay: string;
  metacriticDisplay: string;
  releaseDateDisplay: string;
  genresLine: string;
  platforms?: string;
  developers?: string;
  publishers?: string;
  esrb?: string;
  audienceLine: string;
  audienceLabel: "From your search" | "Catalog note";

  pricingMode: GameDetailPricingMode;
  hasTrustedVerifiedBuy: boolean;
  hasVerifiedStoreListings: boolean;
  showSplitPrimaryLayout: boolean;
  showEstimatedPriceNoStoreLinks: boolean;
  primaryUsdFallback: boolean;
  freeToPlayStoreUrl?: string;
  primaryTrustedBuyUrl?: string;
  primaryDeal?: GameDetailVerifiedDealView | null;
  bestPrice?: {
    displayPrice: string;
    storeName?: string | null;
    matchedTitle?: string | null;
  } | null;

  otherTrustedDeals: GameDetailVerifiedDealView[];
  trustedOffers: GameDetailVerifiedDealView[];
  untrustedDeals: GameDetailVerifiedDealView[];
  dealsLastCheckedLabel?: string;
  priceDisclaimer: string;

  sidebarShowsPriceFigure: boolean;
  sidebarIsGenericUnavailable: boolean;
  sidebarPriceTitle: string;
  sidebarPriceValue: string;
  sidebarPriceBody: string;

  trailerUrl?: string;
  trailerPoster?: string;
  screenshots: GameDetailScreenshot[];

  recommendFit?: RecommendContextFitData | null;
  fitTransparencyNote?: string;

  curatedCollection?: { slug: string; h1: string } | null;
  relatedGames?: Array<{ title: string }>;
};
