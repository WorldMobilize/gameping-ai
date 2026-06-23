import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import GameBreadcrumbs from "@/components/GameBreadcrumbs";
import GameScreenshotLightbox from "@/components/GameScreenshotLightbox";
import RecommendContextFitCardView from "@/components/recommend/RecommendContextFitCardView";
import { gameDetailPath } from "@/lib/curated/game-links";
import type { GameDetailViewData } from "@/components/game/game-detail-view-types";

const FREE_TO_PLAY_TITLE = "Free to play";
const FREE_TO_PLAY_BODY =
  "This game appears to be free to play on supported stores.";
const NO_VERIFIED_DEAL_TITLE = "No verified deal yet";
const NO_VERIFIED_DEAL_BODY =
  "We couldn't confirm a reliable current price from our supported stores.";
const NO_VERIFIED_DEAL_HELPER =
  "Check the store page or track this game to catch future drops.";

const LIGHT_PAGE_PRIMARY_CTA =
  "gp-page-cta inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)]";

const LIGHT_PAGE_MUTED_CTA =
  "inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-8 py-3.5 text-base font-semibold text-slate-600";

export type GameDetailViewProps = {
  data: GameDetailViewData;
  theme?: "dark" | "light";
  compact?: boolean;
  fitSlot?: ReactNode;
  trackPriceSlot?: ReactNode;
  showExploreSection?: boolean;
};

function DetailRow({
  label,
  value,
  theme,
  compact,
  valueTone = "default",
}: {
  label: string;
  value?: string | number | null;
  theme: "dark" | "light";
  compact?: boolean;
  /** "score" → valid value uses page accent, N/A uses muted unavailable. */
  valueTone?: "default" | "score";
}) {
  const isNA = value == null || value === "" || value === "N/A";
  const darkValueClass =
    valueTone === "score"
      ? isNA
        ? "text-white/45"
        : "text-[color:var(--page-accent-strong)]"
      : "text-white/85";
  const lightValueClass =
    valueTone === "score"
      ? isNA
        ? "text-slate-400"
        : "text-[color:var(--page-accent-text)]"
      : "text-slate-900";

  if (theme === "dark" && !compact) {
    return (
      <div className="flex items-start justify-between gap-6 border-b border-white/10 py-4">
        <span className="text-sm text-white/65">{label}</span>
        <span className={`max-w-[65%] text-right text-sm font-bold ${darkValueClass}`}>
          {value || "N/A"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-xs text-slate-600">{label}</span>
      <span className={`max-w-[65%] text-right text-xs font-bold ${lightValueClass}`}>
        {value || "N/A"}
      </span>
    </div>
  );
}

function FreeToPlayPricingState({
  storeUrl,
  theme,
  compact,
}: {
  storeUrl?: string;
  theme: "dark" | "light";
  compact?: boolean;
}) {
  const titleClass =
    theme === "dark" && !compact
      ? "text-lg font-semibold leading-snug text-white/75"
      : "text-sm font-semibold leading-snug text-slate-800";
  const bodyClass =
    theme === "dark" && !compact
      ? "text-xs leading-relaxed text-white/70"
      : "text-xs leading-relaxed text-slate-600";
  const linkClass =
    theme === "dark" && !compact
      ? "mt-3 inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-2 text-xs font-black text-[color:var(--page-accent-strong)] transition hover:bg-[var(--page-accent-soft)]"
      : "mt-3 inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1.5 text-xs font-black text-[color:var(--page-accent-text)]";

  return (
    <>
      <p className={titleClass}>{FREE_TO_PLAY_TITLE}</p>
      <p className={bodyClass}>{FREE_TO_PLAY_BODY}</p>
      {storeUrl ? (
        <a href={storeUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
          View store page
        </a>
      ) : null}
    </>
  );
}

function PricingUnavailableState({
  variant = "default",
  theme,
  compact,
}: {
  variant?: "default" | "console";
  theme: "dark" | "light";
  compact?: boolean;
}) {
  const titleClass =
    theme === "dark" && !compact
      ? "text-lg font-semibold leading-snug text-white/75"
      : "text-sm font-semibold leading-snug text-slate-800";
  const bodyClass =
    theme === "dark" && !compact
      ? "text-xs leading-relaxed text-white/70"
      : "text-xs leading-relaxed text-slate-600";
  const helperClass =
    theme === "dark" && !compact
      ? "text-xs leading-relaxed text-white/65"
      : "text-xs leading-relaxed text-slate-600";

  return (
    <>
      <p className={titleClass}>{NO_VERIFIED_DEAL_TITLE}</p>
      <p className={bodyClass}>
        {variant === "console"
          ? "Verified PC store pricing may not be available for this platform."
          : NO_VERIFIED_DEAL_BODY}
      </p>
      {variant === "default" ? <p className={helperClass}>{NO_VERIFIED_DEAL_HELPER}</p> : null}
    </>
  );
}

function VerifiedStoreDealCard({
  deal,
  buyLabel,
  theme,
  compact,
}: {
  deal: GameDetailViewData["trustedOffers"][number];
  buyLabel?: string;
  theme: "dark" | "light";
  compact?: boolean;
}) {
  if (theme === "dark" && !compact) {
    return (
      <div className="grid items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 md:grid-cols-[1fr_auto_auto]">
        <div>
          <p className="font-black">{deal.storeName}</p>
          <p className="text-xs text-white/70">Matched listing: {deal.matchedTitle}</p>
          <p className="text-sm text-white/70">Normal: {deal.normalPrice}</p>
        </div>
        <p className="text-2xl font-black text-[color:var(--page-accent-strong)]">{deal.salePrice}</p>
        {deal.buyUrl ? (
          <a
            href={deal.buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="gp-page-cta inline-flex items-center justify-center rounded-full px-5 py-3 text-center text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)]"
          >
            {buyLabel ?? "Buy"}
          </a>
        ) : (
          <span className="text-center text-sm text-white/70">No verified store link</span>
        )}
      </div>
    );
  }

  if (theme === "light" && !compact) {
    return (
      <div className="grid items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto]">
        <div>
          <p className="font-bold text-slate-900">{deal.storeName}</p>
          <p className="text-xs text-slate-600">Matched listing: {deal.matchedTitle}</p>
          <p className="text-sm text-slate-600">Normal: {deal.normalPrice}</p>
        </div>
        <p className="text-2xl font-extrabold tabular-nums text-[color:var(--page-accent-text)]">{deal.salePrice}</p>
        {deal.buyUrl ? (
          <a
            href={deal.buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`shrink-0 text-center ${LIGHT_PAGE_PRIMARY_CTA} px-6 py-3 text-sm`}
          >
            {buyLabel ?? "Buy"}
          </a>
        ) : (
          <span className="text-center text-sm text-slate-600">No verified store link</span>
        )}
      </div>
    );
  }

  return (
    <div className="grid items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_auto_auto]">
      <div>
        <p className="text-sm font-black text-slate-900">{deal.storeName}</p>
        <p className="text-xs text-slate-600">Matched listing: {deal.matchedTitle}</p>
        <p className="text-xs text-slate-600">Normal: {deal.normalPrice}</p>
      </div>
      <p className="text-lg font-black text-[color:var(--page-accent-text)]">{deal.salePrice}</p>
      {deal.buyUrl ? (
        <span className="rounded-full bg-slate-900 px-4 py-2 text-center text-xs font-black text-white">
          {buyLabel ?? "Buy"}
        </span>
      ) : (
        <span className="text-center text-xs text-slate-600">No verified store link</span>
      )}
    </div>
  );
}

function GameDetailBreadcrumbsBar({
  items,
  theme,
  compact,
}: {
  items: GameDetailViewData["breadcrumbs"];
  theme: "dark" | "light";
  compact?: boolean;
}) {
  if (theme === "dark" && !compact) {
    return <GameBreadcrumbs items={items} theme="dark" />;
  }

  if (theme === "light" && !compact) {
    return <GameBreadcrumbs items={items} theme="light" />;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-600">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-x-2">
            {index > 0 ? <span className="text-slate-300">/</span> : null}
            <span className={index === items.length - 1 ? "text-slate-800" : undefined}>
              {item.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function HeroPricePanel({
  data,
  theme,
  compact,
}: {
  data: GameDetailViewData;
  theme: "dark" | "light";
  compact?: boolean;
}) {
  const { primaryDeal, bestPrice, pricingMode, hasTrustedVerifiedBuy, showEstimatedPriceNoStoreLinks } =
    data;

  if (theme === "dark" && !compact) {
    return (
      <div className="rounded-2xl bg-black/30 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
          {hasTrustedVerifiedBuy ? "Best verified store price" : "Estimated aggregator price"}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {pricingMode === "free_to_play" ? (
            <FreeToPlayPricingState storeUrl={data.freeToPlayStoreUrl} theme={theme} />
          ) : hasTrustedVerifiedBuy && primaryDeal ? (
            <>
              <p className="text-2xl font-black text-[color:var(--page-accent-strong)]">{primaryDeal.salePrice}</p>
              <p className="text-xs leading-relaxed text-white/70">
                {primaryDeal.storeName} · {primaryDeal.matchedTitle}
              </p>
              {data.primaryUsdFallback ? (
                <p className="text-xs text-white/70">{data.priceDisclaimer}</p>
              ) : null}
            </>
          ) : showEstimatedPriceNoStoreLinks && bestPrice ? (
            <>
              <p className="text-2xl font-black text-[color:var(--page-accent-strong)]">Estimated price found</p>
              <p className="text-xs leading-relaxed text-white/70">
                Indicative match only — no additional verified store rows passed title safety
                checks.
              </p>
            </>
          ) : pricingMode === "verified_price" && bestPrice ? (
            <>
              <p className="text-2xl font-black text-[color:var(--page-accent-strong)]">{bestPrice.displayPrice}</p>
              {data.primaryUsdFallback ? (
                <p className="text-xs text-white/70">{data.priceDisclaimer}</p>
              ) : null}
            </>
          ) : pricingMode === "likely_console_or_unsupported" ? (
            <PricingUnavailableState variant="console" theme={theme} />
          ) : (
            <PricingUnavailableState theme={theme} />
          )}
        </div>
      </div>
    );
  }

  if (theme === "light" && !compact) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          {hasTrustedVerifiedBuy ? "Best verified store price" : "Estimated aggregator price"}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {pricingMode === "free_to_play" ? (
            <FreeToPlayPricingState storeUrl={data.freeToPlayStoreUrl} theme={theme} />
          ) : hasTrustedVerifiedBuy && primaryDeal ? (
            <>
              <p className="text-2xl font-extrabold tabular-nums text-[color:var(--page-accent-text)]">{primaryDeal.salePrice}</p>
              <p className="text-xs leading-relaxed text-slate-600">
                {primaryDeal.storeName} · {primaryDeal.matchedTitle}
              </p>
              {data.primaryUsdFallback ? (
                <p className="text-xs text-slate-600">{data.priceDisclaimer}</p>
              ) : null}
            </>
          ) : showEstimatedPriceNoStoreLinks && bestPrice ? (
            <>
              <p className="text-xl font-bold text-slate-900">Estimated price found</p>
              <p className="text-xs leading-relaxed text-slate-600">
                Indicative match only — no additional verified store rows passed title safety checks.
              </p>
            </>
          ) : pricingMode === "verified_price" && bestPrice ? (
            <>
              <p className="text-2xl font-extrabold tabular-nums text-[color:var(--page-accent-text)]">{bestPrice.displayPrice}</p>
              {data.primaryUsdFallback ? (
                <p className="text-xs text-slate-600">{data.priceDisclaimer}</p>
              ) : null}
            </>
          ) : pricingMode === "likely_console_or_unsupported" ? (
            <PricingUnavailableState variant="console" theme={theme} />
          ) : (
            <PricingUnavailableState theme={theme} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80">
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
        {hasTrustedVerifiedBuy ? "Best verified store price" : "Estimated aggregator price"}
      </p>
      {pricingMode === "free_to_play" ? (
        <FreeToPlayPricingState storeUrl={data.freeToPlayStoreUrl} theme={theme} compact />
      ) : hasTrustedVerifiedBuy && primaryDeal ? (
        <>
          <p className="mt-1 text-xl font-black text-[color:var(--page-accent-text)]">{primaryDeal.salePrice}</p>
          <p className="text-[0.65rem] leading-relaxed text-slate-600">
            {primaryDeal.storeName} · {primaryDeal.matchedTitle}
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-xl font-black text-[color:var(--page-accent-text)]">
            {primaryDeal?.salePrice ?? bestPrice?.displayPrice ?? "N/A"}
          </p>
          <p className="text-[0.65rem] leading-relaxed text-slate-600">
            {primaryDeal
              ? `${primaryDeal.storeName} · ${primaryDeal.matchedTitle}`
              : bestPrice
                ? `${bestPrice.storeName ?? "Store"} · ${bestPrice.matchedTitle ?? data.title}`
                : data.title}
          </p>
        </>
      )}
    </div>
  );
}

function HeroPrimaryCta({ data, theme, compact }: { data: GameDetailViewData; theme: "dark" | "light"; compact?: boolean }) {
  const {
    pricingMode,
    freeToPlayStoreUrl,
    hasTrustedVerifiedBuy,
    primaryTrustedBuyUrl,
    primaryDeal,
    bestPrice,
    hasVerifiedStoreListings,
  } = data;

  const darkPrimary =
    "gp-page-cta inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)]";
  const darkMuted = "rounded-full bg-white/10 px-8 py-4 font-bold text-white/70";
  const lightPrimary =
    "gp-page-cta inline-flex rounded-full px-5 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)]";

  if (theme === "dark" && !compact) {
    if (pricingMode === "free_to_play" && freeToPlayStoreUrl) {
      return (
        <a href={freeToPlayStoreUrl} target="_blank" rel="noopener noreferrer" className={darkPrimary}>
          View store page
        </a>
      );
    }
    if (pricingMode === "free_to_play") {
      return <span className={`${darkMuted} text-white/70`}>{FREE_TO_PLAY_TITLE}</span>;
    }
    if (hasTrustedVerifiedBuy && primaryTrustedBuyUrl) {
      return (
        <a href={primaryTrustedBuyUrl} target="_blank" rel="noopener noreferrer" className={darkPrimary}>
          {primaryDeal
            ? `Buy on ${primaryDeal.storeName}`
            : `Buy on ${bestPrice?.storeName || "store"}`}
        </a>
      );
    }
    if (pricingMode === "verified_price" && hasVerifiedStoreListings) {
      return (
        <a href="#verified-store-deals" className={darkPrimary}>
          Compare verified listings
        </a>
      );
    }
    if (pricingMode === "verified_price") {
      return <span className={darkMuted}>No active verified deals right now.</span>;
    }
    if (pricingMode === "likely_console_or_unsupported") {
      return <span className={darkMuted}>Pricing support limited for this platform</span>;
    }
    return <span className={darkMuted}>No verified deal yet</span>;
  }

  if (theme === "light" && !compact) {
    if (pricingMode === "free_to_play" && freeToPlayStoreUrl) {
      return (
        <a
          href={freeToPlayStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={LIGHT_PAGE_PRIMARY_CTA}
        >
          View store page
        </a>
      );
    }
    if (pricingMode === "free_to_play") {
      return <span className={LIGHT_PAGE_MUTED_CTA}>{FREE_TO_PLAY_TITLE}</span>;
    }
    if (hasTrustedVerifiedBuy && primaryTrustedBuyUrl) {
      return (
        <a
          href={primaryTrustedBuyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={LIGHT_PAGE_PRIMARY_CTA}
        >
          {primaryDeal
            ? `Buy on ${primaryDeal.storeName}`
            : `Buy on ${bestPrice?.storeName || "store"}`}
        </a>
      );
    }
    if (pricingMode === "verified_price" && hasVerifiedStoreListings) {
      return (
        <a href="#verified-store-deals" className={LIGHT_PAGE_PRIMARY_CTA}>
          Compare verified listings
        </a>
      );
    }
    if (pricingMode === "verified_price") {
      return <span className={LIGHT_PAGE_MUTED_CTA}>No active verified deals right now.</span>;
    }
    if (pricingMode === "likely_console_or_unsupported") {
      return <span className={LIGHT_PAGE_MUTED_CTA}>Pricing support limited for this platform</span>;
    }
    return <span className={LIGHT_PAGE_MUTED_CTA}>No verified deal yet</span>;
  }

  if (hasTrustedVerifiedBuy && primaryDeal) {
    return <span className={lightPrimary}>Buy on {primaryDeal.storeName}</span>;
  }
  return <span className={lightPrimary}>Compare verified listings</span>;
}

function CompactGallery({
  screenshots,
  title,
}: {
  screenshots: GameDetailViewData["screenshots"];
  title: string;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {screenshots.map((shot, index) => (
        <div
          key={`${shot.id}-${index}`}
          className="relative aspect-video overflow-hidden rounded-lg bg-slate-900"
        >
          <Image
            src={shot.image}
            alt={`${title} screenshot ${index + 1}`}
            fill
            className="object-cover"
            sizes="120px"
          />
        </div>
      ))}
    </div>
  );
}

export default function GameDetailView({
  data,
  theme = "dark",
  compact = false,
  fitSlot,
  trackPriceSlot,
  showExploreSection = false,
}: GameDetailViewProps) {
  const isDarkPage = theme === "dark" && !compact;
  const isLightPage = theme === "light" && !compact;
  const isFullPage = !compact;
  const heroLead = data.description.slice(0, 460);
  const heroSuffix = data.description.length > 460 ? "..." : "";
  const density = compact ? "demo" : "page";

  const fitBlock =
    fitSlot ??
    (data.recommendFit ? (
      <RecommendContextFitCardView
        theme={theme}
        density={density}
        context={data.recommendFit}
        transparencyNote={data.fitTransparencyNote}
      />
    ) : null);

  const trackBlock =
    trackPriceSlot ??
    (compact ? (
      <button
        type="button"
        tabIndex={-1}
        className="mt-4 gp-page-cta inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)]"
      >
        Track price
      </button>
    ) : null);

  const sections = (
    <>
      <section
        className={
          isFullPage
            ? "relative overflow-hidden pb-10"
            : "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
        }
      >
        {/* No per-game blurred cover backdrop — the hero sits directly on the
            fixed red cinematic Games background (the game's own art still shows
            in the visible hero card/gallery below). */}

        {isFullPage ? (
          <>
            {/* Scrim fades to transparent at the bottom so the hero blends into
                the cinematic Games background (no hard horizontal cutoff). */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[#070b14]/70 to-transparent" />
            <div className="pointer-events-none absolute left-10 top-20 h-72 w-72 rounded-full bg-[var(--page-accent-soft)] blur-3xl" />
          </>
        ) : null}

        <div
          className={
            isFullPage
              ? "relative z-10 mx-auto max-w-7xl px-6 py-8"
              : "p-3 sm:p-4"
          }
        >
          <GameDetailBreadcrumbsBar items={data.breadcrumbs} theme={theme} compact={compact} />

          <div
            className={
              isFullPage
                ? "grid gap-10 pt-10 pb-8 lg:grid-cols-[1.05fr_0.95fr]"
                : "mt-4 grid gap-4 sm:grid-cols-[1.05fr_0.95fr]"
            }
          >
            <div>
              <p
                className={
                  isDarkPage
                    ? "mb-5 text-sm uppercase tracking-[0.45em] text-[color:var(--page-accent-strong)]"
                    : isLightPage
                      ? "mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]"
                      : "text-[10px] font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)] sm:text-xs sm:tracking-[0.4em]"
                }
              >
                GamePing pick
              </p>

              <h1
                className={
                  isDarkPage
                    ? "max-w-4xl text-5xl font-black leading-tight text-white md:text-7xl"
                    : isLightPage
                      ? "max-w-4xl text-4xl font-extrabold leading-tight text-white gp-home-display md:text-6xl"
                      : "mt-2 text-xl font-black leading-tight text-slate-900 sm:text-2xl"
                }
              >
                {data.title}
              </h1>

              <p
                className={
                  isDarkPage
                    ? "mt-6 max-w-2xl text-xl leading-9 text-white/75"
                    : isLightPage
                      ? "mt-6 max-w-2xl text-lg leading-8 text-slate-200"
                      : "mt-3 text-sm leading-relaxed text-slate-600"
                }
              >
                {heroLead}
                {heroSuffix}
              </p>

              <div className={isFullPage ? "mt-8 flex flex-wrap gap-3" : "mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2"}>
                {data.genres.slice(0, 6).map((genre) => (
                  <span
                    key={genre}
                    className={
                      isDarkPage
                        ? "rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-2 text-sm font-bold text-[color:var(--page-accent-strong)] backdrop-blur"
                        : isLightPage
                          ? "rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--page-accent-text)]"
                          : "rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-0.5 text-[0.65rem] font-bold text-[color:var(--page-accent-text)] sm:px-3 sm:py-1 sm:text-xs"
                    }
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <div className={isFullPage ? "mt-10 flex flex-wrap items-center gap-4" : "mt-4"}>
                <HeroPrimaryCta data={data} theme={theme} compact={compact} />
                {isFullPage && data.trailerUrl ? (
                  <a
                    href="#trailer"
                    className={
                      isDarkPage
                        ? "rounded-full border border-white/15 bg-white/5 px-8 py-4 font-bold text-white/80 backdrop-blur transition hover:border-[color:var(--page-accent-border)] hover:text-[color:var(--page-accent-strong)]"
                        : "rounded-full border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    }
                  >
                    ▶ Watch trailer
                  </a>
                ) : null}
              </div>
            </div>

            <div className="relative">
              <div
                className={
                  isDarkPage
                    ? "relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b14]/80 shadow-lg shadow-black/25"
                    : isLightPage
                      ? "relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/40"
                      : "overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                }
              >
                {data.heroImage ? (
                  isDarkPage ? (
                    <img
                      src={data.heroImage}
                      alt={data.title}
                      className="h-[450px] w-full object-cover"
                    />
                  ) : isLightPage ? (
                    <img
                      src={data.heroImage}
                      alt={data.title}
                      className="h-[320px] w-full object-cover md:h-[380px]"
                    />
                  ) : (
                    <div className="relative h-32 w-full bg-slate-900 sm:h-36">
                      <Image
                        src={data.heroImage}
                        alt={data.title}
                        fill
                        className="object-cover"
                        sizes="280px"
                      />
                    </div>
                  )
                ) : (
                  <div
                    className={
                      isDarkPage
                        ? "flex h-[450px] items-center justify-center bg-black/40 text-white/70"
                        : "flex h-32 items-center justify-center bg-slate-900 text-white/70 sm:h-36"
                    }
                  >
                    No image available
                  </div>
                )}

                <div className={isFullPage ? "p-6" : "p-3"}>
                  <div className="flex flex-col gap-3">
                    <HeroPricePanel data={data} theme={theme} compact={compact} />
                    <div className={isFullPage ? "grid grid-cols-2 gap-3" : "mt-2 grid grid-cols-2 gap-2"}>
                      <div
                        className={
                          isDarkPage
                            ? "flex items-center justify-between gap-3 rounded-2xl bg-black/30 px-4 py-3"
                            : "flex items-center justify-between rounded-xl bg-white px-2.5 py-2 ring-1 ring-slate-200/80 sm:px-4 sm:py-3"
                        }
                      >
                        <p
                          className={
                            isDarkPage
                              ? "text-[10px] font-black uppercase tracking-widest text-white/70"
                              : "text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600"
                          }
                        >
                          Rating
                        </p>
                        <p
                          className={
                            isDarkPage
                              ? "text-lg font-black leading-none text-yellow-300 sm:text-xl"
                              : "text-sm font-black text-amber-600"
                          }
                        >
                          {data.ratingDisplay}
                        </p>
                      </div>
                      <div
                        className={
                          isDarkPage
                            ? "flex items-center justify-between gap-3 rounded-2xl bg-black/30 px-4 py-3"
                            : "flex items-center justify-between rounded-xl bg-white px-2.5 py-2 ring-1 ring-slate-200/80"
                        }
                      >
                        <p
                          className={
                            isDarkPage
                              ? "text-[10px] font-black uppercase tracking-widest text-white/70"
                              : "text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600"
                          }
                        >
                          Metacritic
                        </p>
                        <p
                          className={
                            isDarkPage
                              ? `text-lg font-black leading-none sm:text-xl ${
                                  data.metacriticDisplay === "N/A"
                                    ? "text-white/45"
                                    : "text-[color:var(--page-accent-strong)]"
                                }`
                              : `text-sm font-black ${
                                  data.metacriticDisplay === "N/A"
                                    ? "text-slate-400"
                                    : "text-[color:var(--page-accent-text)]"
                                }`
                          }
                        >
                          {data.metacriticDisplay}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p
                    className={
                      isDarkPage
                        ? "mt-5 text-sm leading-6 text-white/70"
                        : isLightPage
                          ? "mt-4 text-sm leading-6 text-slate-600"
                          : "mt-2 text-[0.65rem] leading-relaxed text-slate-600"
                    }
                  >
                    {data.audienceLine}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={
          isFullPage
            ? "mx-auto max-w-7xl px-6 pb-10"
            : "grid grid-cols-2 gap-2 sm:grid-cols-4"
        }
      >
        {isDarkPage ? (
          <div className="grid gap-5 md:grid-cols-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Rating</p>
              <p className="mt-3 text-3xl font-black text-yellow-300">{data.ratingDisplay}</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Release</p>
              <p className="mt-3 text-2xl font-black text-white">{data.releaseDateDisplay}</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Genres</p>
              <p className="mt-3 text-lg font-bold text-[color:var(--page-accent-strong)]">{data.genresLine}</p>
            </div>
            <div className="rounded-[2rem] border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--page-accent-strong)]">{data.audienceLabel}</p>
              <p className="mt-3 text-sm leading-6 text-white/75">{data.audienceLine}</p>
            </div>
          </div>
        ) : isLightPage ? (
          <div className="grid gap-5 md:grid-cols-4">
            {[
              { label: "Rating", value: data.ratingDisplay, className: "text-amber-600" },
              { label: "Release", value: data.releaseDateDisplay, className: "text-slate-900" },
              { label: "Genres", value: data.genresLine, className: "text-[color:var(--page-accent-text)]" },
              {
                label: data.audienceLabel,
                value: data.audienceLine,
                className: "text-slate-700",
                accent: true,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={
                  stat.accent
                    ? "rounded-2xl border border-[color:var(--page-accent-border)] bg-white p-6 shadow-sm"
                    : "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm"
                }
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                  {stat.label}
                </p>
                <p className={`mt-3 text-lg font-bold leading-snug ${stat.className}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <>
            {[
              { label: "Rating", value: data.ratingDisplay, className: "text-amber-600" },
              { label: "Release", value: data.releaseDateDisplay, className: "text-slate-900" },
              { label: "Genres", value: data.genresLine, className: "text-[color:var(--page-accent-text)]" },
              {
                label: data.audienceLabel,
                value: data.audienceLine,
                className: "text-slate-700",
                accent: true,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={
                  stat.accent
                    ? "rounded-xl border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] p-3"
                    : "rounded-xl border border-slate-200/90 bg-white p-3"
                }
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {stat.label}
                </p>
                <p className={`mt-1 text-xs font-bold leading-snug ${stat.className}`}>{stat.value}</p>
              </div>
            ))}
          </>
        )}
      </section>

      {isFullPage && data.trailerUrl ? (
        <section id="trailer" className="mx-auto max-w-7xl px-6 pb-14">
          {isDarkPage ? (
            <>
              <p className="text-sm uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">Official media</p>
              <h2 className="mt-3 text-4xl font-black text-white">Trailer</h2>
              <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl">
                <video
                  src={data.trailerUrl}
                  controls
                  poster={data.trailerPoster}
                  className="aspect-video w-full bg-black object-cover"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
                Official media
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-white gp-home-display">Trailer</h2>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-900 shadow-lg shadow-slate-200/40">
                <video
                  src={data.trailerUrl}
                  controls
                  poster={data.trailerPoster}
                  className="aspect-video w-full bg-black object-cover"
                />
              </div>
            </>
          )}
        </section>
      ) : null}

      {data.screenshots.length > 0 ? (
        <section
          className={
            isFullPage
              ? "mx-auto max-w-7xl px-6 pb-12"
              : "rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
          }
        >
          <p
            className={
              isDarkPage
                ? "text-sm uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]"
                : isLightPage
                  ? "text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]"
                  : "text-[10px] font-black uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]"
            }
          >
            Gallery
          </p>
          <h2
            className={
              isDarkPage
                ? "mt-3 text-4xl font-black text-white"
                : isLightPage
                  ? "mt-3 text-3xl font-extrabold text-white gp-home-display"
                  : "mt-2 text-lg font-black text-slate-900"
            }
          >
            Screenshots
          </h2>
          {isFullPage ? (
            <GameScreenshotLightbox
              screenshots={data.screenshots}
              gameTitle={data.title}
              theme={isLightPage ? "light" : "dark"}
            />
          ) : (
            <CompactGallery screenshots={data.screenshots} title={data.title} />
          )}
        </section>
      ) : null}

      <section
        className={
          isFullPage
            ? "mx-auto grid max-w-7xl gap-6 px-6 pb-20 lg:grid-cols-[1fr_0.8fr]"
            : `grid gap-3 ${compact ? "sm:grid-cols-[1fr_0.85fr]" : "lg:grid-cols-[1fr_0.8fr]"}`
        }
      >
        <div className={isFullPage ? "space-y-6" : "space-y-3"}>
          <div
            className={
              isDarkPage
                ? "rounded-[2rem] border border-white/10 bg-white/[0.04] p-7"
                : isLightPage
                  ? "rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm"
                  : "rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
            }
          >
            <p
              className={
                isDarkPage
                  ? "text-sm uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]"
                  : isLightPage
                    ? "text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]"
                    : "text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]"
              }
            >
              Overview
            </p>
            <h2
              className={
                isDarkPage
                  ? "mt-4 text-3xl font-black"
                  : isLightPage
                    ? "mt-4 text-3xl font-extrabold text-slate-900 gp-home-display"
                    : "mt-2 text-lg font-black text-slate-900"
              }
            >
              About this game
            </h2>
            <p
              className={
                isDarkPage
                  ? "mt-5 whitespace-pre-line text-lg leading-8 text-white/70"
                  : isLightPage
                    ? "mt-5 whitespace-pre-line text-base leading-8 text-slate-600"
                    : "mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600"
              }
            >
              {data.description}
            </p>
          </div>

          {fitBlock}

          <div
            id="verified-store-deals"
            className={
              isDarkPage
                ? "scroll-mt-24 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7"
                : isLightPage
                  ? "scroll-mt-24 rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm"
                  : "rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
            }
          >
            <p
              className={
                isDarkPage
                  ? "text-sm uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]"
                  : isLightPage
                    ? "text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]"
                    : "text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]"
              }
            >
              Store comparison
            </p>
            <h2
              className={
                isDarkPage
                  ? "mt-4 text-3xl font-black"
                  : isLightPage
                    ? "mt-4 text-3xl font-extrabold text-slate-900 gp-home-display"
                    : "mt-2 text-lg font-black text-slate-900"
              }
            >
              Verified store deals
            </h2>
            <p
              className={
                isDarkPage
                  ? "mt-2 text-sm text-white/70"
                  : isLightPage
                    ? "mt-2 text-sm text-slate-600"
                    : "mt-1 text-xs leading-relaxed text-slate-600"
              }
            >
              {data.priceDisclaimer}
            </p>
            {data.dealsLastCheckedLabel ? (
              <p
                className={
                  isDarkPage
                    ? "mt-2 text-xs text-white/65"
                    : isLightPage
                      ? "mt-2 text-xs text-slate-600"
                      : "mt-1 text-xs text-slate-600"
                }
              >
                {data.dealsLastCheckedLabel}
              </p>
            ) : null}

            {data.pricingMode === "free_to_play" ? (
              <div className={isFullPage ? "mt-6" : "mt-3"}>
                <p
                  className={
                    isDarkPage
                      ? "text-lg font-semibold text-white/75"
                      : isLightPage
                        ? "text-lg font-semibold text-slate-800"
                        : "text-sm font-semibold text-slate-800"
                  }
                >
                  {FREE_TO_PLAY_TITLE}
                </p>
                <p
                  className={
                    isDarkPage
                      ? "mt-2 text-sm leading-relaxed text-white/70"
                      : isLightPage
                        ? "mt-2 text-sm leading-relaxed text-slate-600"
                        : "mt-1 text-xs text-slate-600"
                  }
                >
                  {FREE_TO_PLAY_BODY}
                </p>
                {data.freeToPlayStoreUrl ? (
                  <a
                    href={data.freeToPlayStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      isDarkPage
                        ? "mt-4 inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-5 py-2.5 text-sm font-black text-[color:var(--page-accent-strong)] transition hover:bg-[var(--page-accent-soft)]"
                        : isLightPage
                          ? "mt-4 inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-5 py-2.5 text-sm font-semibold text-[color:var(--page-accent-text)] transition hover:bg-[var(--page-accent-soft)]"
                          : "mt-3 inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-2 text-xs font-black text-[color:var(--page-accent-text)]"
                    }
                  >
                    View store page
                  </a>
                ) : null}
              </div>
            ) : (
              <div className={isFullPage ? "mt-6 space-y-8" : "mt-3 space-y-3"}>
                {data.showSplitPrimaryLayout && data.primaryDeal ? (
                  <div
                    className={
                      isDarkPage
                        ? "rounded-2xl border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] p-6"
                        : isLightPage
                          ? "rounded-2xl border border-[color:var(--page-accent-border)] bg-white p-6 shadow-sm"
                          : "rounded-xl border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] p-3"
                    }
                  >
                    <p
                      className={
                        isDarkPage
                          ? "text-xs font-black uppercase tracking-[0.25em] text-[color:var(--page-accent-strong)]"
                          : isLightPage
                            ? "text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--page-accent-text)]"
                            : "text-[9px] font-semibold uppercase tracking-[0.2em] text-[color:var(--page-accent-text)]"
                      }
                    >
                      Best verified price
                    </p>
                    <div
                      className={
                        isFullPage
                          ? "mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
                          : "mt-2"
                      }
                    >
                      <div>
                        <p
                          className={
                            isDarkPage
                              ? "text-4xl font-black text-white"
                              : isLightPage
                                ? "text-4xl font-extrabold tabular-nums text-slate-900"
                                : "text-2xl font-black text-slate-900"
                          }
                        >
                          {data.primaryDeal.salePrice}
                        </p>
                        <p
                          className={
                            isDarkPage
                              ? "mt-2 text-sm text-white/70"
                              : isLightPage
                                ? "mt-2 text-sm text-slate-600"
                                : "mt-1 text-xs text-slate-600"
                          }
                        >
                          {data.primaryDeal.storeName} · {data.primaryDeal.matchedTitle}
                        </p>
                        {data.primaryUsdFallback ? (
                          <p
                            className={
                              isDarkPage
                                ? "mt-2 text-xs text-white/70"
                                : isLightPage
                                  ? "mt-2 text-xs text-slate-600"
                                  : "mt-1 text-xs text-slate-600"
                            }
                          >
                            {data.priceDisclaimer}
                          </p>
                        ) : null}
                      </div>
                      {data.primaryTrustedBuyUrl && isFullPage ? (
                        isDarkPage ? (
                          <a
                            href={data.primaryTrustedBuyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gp-page-cta inline-flex shrink-0 items-center justify-center rounded-full px-8 py-4 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)]"
                          >
                            Buy now
                          </a>
                        ) : (
                          <a
                            href={data.primaryTrustedBuyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`shrink-0 ${LIGHT_PAGE_PRIMARY_CTA}`}
                          >
                            Buy now
                          </a>
                        )
                      ) : compact ? (
                        <span className="mt-3 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white">
                          Buy now
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {data.showEstimatedPriceNoStoreLinks && data.bestPrice ? (
                  <div
                    className={
                      isDarkPage
                        ? "rounded-2xl border border-white/10 bg-black/30 p-5"
                        : isLightPage
                          ? "rounded-2xl border border-slate-200/90 bg-slate-50 p-5"
                          : "rounded-xl border border-slate-200 bg-slate-50 p-3"
                    }
                  >
                    <p
                      className={
                        isDarkPage
                          ? "text-lg font-black text-white/90"
                          : isLightPage
                            ? "text-lg font-bold text-slate-900"
                            : "text-sm font-black text-slate-900"
                      }
                    >
                      Estimated price found
                    </p>
                    <p
                      className={
                        isDarkPage
                          ? "mt-2 text-sm leading-6 text-white/70"
                          : isLightPage
                            ? "mt-2 text-sm leading-6 text-slate-600"
                            : "mt-1 text-xs text-slate-600"
                      }
                    >
                      We found an indicative price, but no additional verified store deal rows met our
                      title safety checks right now.
                    </p>
                  </div>
                ) : null}

                {data.otherTrustedDeals.length > 0 ? (
                  <div className="space-y-3">
                    {isFullPage ? (
                      <h3
                        className={
                          isDarkPage
                            ? "text-sm font-black uppercase tracking-[0.28em] text-white/70"
                            : "text-sm font-semibold uppercase tracking-[0.28em] text-slate-600"
                        }
                      >
                        Other verified stores
                      </h3>
                    ) : null}
                    {data.otherTrustedDeals.map((deal) => (
                      <VerifiedStoreDealCard
                        key={deal.id}
                        deal={deal}
                        theme={theme}
                        compact={compact}
                      />
                    ))}
                  </div>
                ) : null}

                {!data.showSplitPrimaryLayout && data.trustedOffers.length > 0 ? (
                  <div className="space-y-3">
                    {data.trustedOffers.map((deal) => (
                      <VerifiedStoreDealCard
                        key={deal.id}
                        deal={deal}
                        theme={theme}
                        compact={compact}
                      />
                    ))}
                  </div>
                ) : null}

                {data.untrustedDeals.length > 0 && isFullPage ? (
                  <div className="space-y-3">
                    <h3
                      className={
                        isDarkPage
                          ? "text-sm font-black uppercase tracking-[0.28em] text-white/70"
                          : "text-sm font-semibold uppercase tracking-[0.28em] text-slate-600"
                      }
                    >
                      Listings without a verified buy link
                    </h3>
                    {data.untrustedDeals.map((deal) => (
                      <VerifiedStoreDealCard key={deal.id} deal={deal} theme={theme} compact={compact} />
                    ))}
                  </div>
                ) : null}

                {!data.showSplitPrimaryLayout &&
                data.trustedOffers.length === 0 &&
                !data.showEstimatedPriceNoStoreLinks ? (
                  <p
                    className={
                      isDarkPage
                        ? "text-white/70"
                        : isLightPage
                          ? "text-sm text-slate-600"
                          : "text-xs text-slate-600"
                    }
                  >
                    {data.pricingMode === "verified_price"
                      ? "No active verified deals right now."
                      : data.pricingMode === "likely_console_or_unsupported"
                        ? "Verified PC store deals may not be listed for this platform."
                        : NO_VERIFIED_DEAL_BODY}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <aside className={isFullPage ? "space-y-6" : "space-y-3"}>
          <div
            className={
              isDarkPage
                ? "rounded-[2rem] border border-white/10 bg-white/[0.04] p-7"
                : isLightPage
                  ? "rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm"
                  : "rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
            }
          >
            <p
              className={
                isDarkPage
                  ? "text-sm uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]"
                  : isLightPage
                    ? "text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]"
                    : "text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]"
              }
            >
              Game info
            </p>
            <div className={isFullPage ? "mt-5" : "mt-2"}>
              <DetailRow label="Release date" value={data.releaseDateDisplay} theme={theme} compact={compact} />
              <DetailRow label="Genres" value={data.genresLine} theme={theme} compact={compact} />
              <DetailRow label="Platforms" value={data.platforms} theme={theme} compact={compact} />
              <DetailRow label="Developer" value={data.developers} theme={theme} compact={compact} />
              <DetailRow label="Publisher" value={data.publishers} theme={theme} compact={compact} />
              <DetailRow label="ESRB" value={data.esrb} theme={theme} compact={compact} />
              <DetailRow label="RAWG rating" value={data.ratingDisplay} theme={theme} compact={compact} />
              <DetailRow label="Metacritic" value={data.metacriticDisplay} theme={theme} compact={compact} valueTone="score" />
            </div>
          </div>

          <div
            className={
              isDarkPage
                ? `sticky top-6 rounded-[2rem] border p-7 ${
                    data.sidebarShowsPriceFigure
                      ? "border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)]"
                      : "border-white/10 bg-white/[0.04]"
                  }`
                : isLightPage
                  ? `sticky top-6 rounded-2xl border p-7 shadow-sm ${
                      data.sidebarShowsPriceFigure
                        ? "border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)]"
                        : "border-slate-200/90 bg-white"
                    }`
                  : "rounded-2xl border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] p-4"
            }
          >
            <p
              className={
                isDarkPage
                  ? `text-sm uppercase tracking-[0.35em] ${
                      data.sidebarShowsPriceFigure ? "text-[color:var(--page-accent-strong)]" : "text-white/70"
                    }`
                  : isLightPage
                    ? "text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]"
                    : "text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]"
              }
            >
              {data.sidebarPriceTitle}
            </p>
            <h2
              className={
                isDarkPage
                  ? `mt-4 ${
                      data.sidebarShowsPriceFigure
                        ? "text-4xl font-black"
                        : "text-xl font-semibold text-white/75"
                    }`
                  : isLightPage
                    ? `mt-4 ${
                        data.sidebarShowsPriceFigure
                          ? "text-4xl font-extrabold tabular-nums text-slate-900"
                          : "text-xl font-semibold text-slate-800"
                      }`
                    : "text-2xl font-black text-slate-900"
              }
            >
              {data.sidebarPriceValue}
            </h2>
            {data.primaryUsdFallback ? (
              <p
                className={
                  isDarkPage
                    ? "mt-2 text-xs text-white/70"
                    : isLightPage
                      ? "mt-2 text-xs text-slate-600"
                      : "mt-2 text-xs text-slate-600"
                }
              >
                {data.priceDisclaimer}
              </p>
            ) : null}
            <p
              className={
                isDarkPage
                  ? `mt-4 leading-relaxed ${
                      data.sidebarShowsPriceFigure ? "text-white/70" : "text-sm text-white/70"
                    }`
                  : isLightPage
                    ? "mt-4 text-sm leading-relaxed text-slate-600"
                    : "mt-2 text-xs leading-relaxed text-slate-600"
              }
            >
              {data.sidebarPriceBody}
            </p>
            {data.pricingMode === "free_to_play" && data.freeToPlayStoreUrl && isFullPage ? (
              <a
                href={data.freeToPlayStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  isDarkPage
                    ? "mt-4 inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-5 py-2.5 text-sm font-black text-[color:var(--page-accent-strong)] transition hover:bg-[var(--page-accent-soft)]"
                    : "mt-4 inline-flex rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-5 py-2.5 text-sm font-semibold text-[color:var(--page-accent-text)] transition hover:bg-[var(--page-accent-soft)]"
                }
              >
                View store page
              </a>
            ) : null}
            {data.sidebarIsGenericUnavailable && isFullPage ? (
              <p
                className={
                  isDarkPage
                    ? "mt-2 text-xs leading-relaxed text-white/65"
                    : "mt-2 text-xs leading-relaxed text-slate-600"
                }
              >
                {NO_VERIFIED_DEAL_HELPER}
              </p>
            ) : null}
            {trackBlock}
          </div>
        </aside>
      </section>

      {showExploreSection && isFullPage ? (
        <section
          className={
            isDarkPage
              ? "mx-auto max-w-7xl px-6 pb-14 pt-10"
              : "mx-auto max-w-7xl px-6 pb-14 pt-10"
          }
          aria-labelledby="game-detail-explore-heading"
        >
          <div
            className={
              isDarkPage
                ? "rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-8 md:px-10"
                : "rounded-2xl border border-slate-200/90 bg-white px-6 py-8 shadow-sm md:px-10"
            }
          >
            <h2
              id="game-detail-explore-heading"
              className={
                isDarkPage
                  ? "text-xs font-black uppercase tracking-[0.35em] text-white/70"
                  : "text-xs font-semibold uppercase tracking-[0.35em] text-slate-600"
              }
            >
              Continue exploring
            </h2>
            <p
              className={
                isDarkPage
                  ? "mt-3 max-w-2xl text-sm leading-6 text-white/70"
                  : "mt-3 max-w-2xl text-sm leading-6 text-slate-600"
              }
            >
              Jump back into discovery whenever you are ready—browse the directory, scan curated
              angles, or describe what you want next.
            </p>

            {data.curatedCollection ? (
              <p className={isDarkPage ? "mt-5 text-sm text-white/70" : "mt-5 text-sm text-slate-600"}>
                Featured in{" "}
                <Link
                  href={`/curated/${data.curatedCollection.slug}`}
                  className={
                    isDarkPage
                      ? "font-bold text-[color:var(--page-accent-strong)] underline-offset-4 hover:underline"
                      : "font-semibold text-[color:var(--page-accent-text)] underline-offset-4 hover:text-[color:var(--page-accent-text)] hover:underline"
                  }
                >
                  {data.curatedCollection.h1}
                </Link>
                .
              </p>
            ) : null}

            {data.relatedGames && data.relatedGames.length > 0 ? (
              <div className="mt-8">
                <h3
                  className={
                    isDarkPage ? "text-sm font-black text-white/80" : "text-sm font-bold text-slate-900"
                  }
                >
                  Similar games to explore
                </h3>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {data.relatedGames.map((game) => (
                    <li key={game.title}>
                      <Link
                        href={gameDetailPath(game.title)}
                        className={
                          isDarkPage
                            ? "inline-flex rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/80 transition hover:border-[color:var(--page-accent-border)] hover:text-[color:var(--page-accent-strong)]"
                            : "inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[color:var(--page-accent-border)] hover:bg-[var(--page-accent-soft)] hover:text-[color:var(--page-accent-text)]"
                        }
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
                  className={
                    isDarkPage
                      ? "text-[color:var(--page-accent-strong)] underline-offset-4 transition hover:text-[color:var(--page-accent-strong)] hover:underline"
                      : "font-semibold text-[color:var(--page-accent-text)] underline-offset-4 transition hover:text-[color:var(--page-accent-text)] hover:underline"
                  }
                >
                  Browse games A–Z
                </Link>
              </li>
              <li>
                <Link
                  href="/curated"
                  className={
                    isDarkPage
                      ? "text-[color:var(--page-accent-strong)] underline-offset-4 transition hover:text-[color:var(--page-accent-strong)] hover:underline"
                      : "font-semibold text-[color:var(--page-accent-text)] underline-offset-4 transition hover:text-[color:var(--page-accent-text)] hover:underline"
                  }
                >
                  Explore curated lists
                </Link>
              </li>
              <li>
                <Link
                  href="/recommend"
                  className={
                    isDarkPage
                      ? "text-[color:var(--page-accent-strong)] underline-offset-4 transition hover:text-[color:var(--page-accent-strong)] hover:underline"
                      : "font-semibold text-[color:var(--page-accent-text)] underline-offset-4 transition hover:text-[color:var(--page-accent-text)] hover:underline"
                  }
                >
                  Try AI recommendations
                </Link>
              </li>
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );

  if (compact && theme === "light") {
    return <div className="space-y-3 pb-6">{sections}</div>;
  }

  return sections;
}
