import Link from "next/link";
import Navbar from "@/components/Navbar";
import GameScreenshotLightbox from "@/components/GameScreenshotLightbox";
import TrackPriceButton from "@/components/TrackPriceButton";
import { getCachedRawgGame, setCachedRawgGame } from "@/lib/cache";
import {
  AGGREGATOR_PRICE_DISCLAIMER,
  formatAggregatorPriceLine,
  formatDealsLastCheckedLabel,
} from "@/lib/pricing/display";
import type { BestPriceResult, VerifiedDealRow } from "@/lib/pricing/price-service";
import {
  buildUnifiedTrustedVerifiedOffers,
  lookupBestPrice,
  lookupDeals,
  parseVerifiedDealSalePrice,
} from "@/lib/pricing/price-service";
import { verifiedDealDisplayDedupeKey } from "@/lib/pricing/verified-deal-row";

type RawgGame = {
  id: number;
  name: string;
  description_raw?: string;
  background_image?: string;
  rating?: number;
  metacritic?: number;
  released?: string;
  genres?: { name: string }[];
  platforms?: { platform: { name: string } }[];
  stores?: { store?: { slug?: string; name?: string }; url?: string }[];
  developers?: { name: string }[];
  publishers?: { name: string }[];
  esrb_rating?: { name: string };
};

type RawgScreenshot = {
  id: number;
  image: string;
};

type RawgMovie = {
  id: number;
  name: string;
  data?: {
    max?: string;
    "480"?: string;
  };
  preview?: string;
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

async function getRawgScreenshots(gameId?: number): Promise<RawgScreenshot[]> {
  if (!gameId) return [];

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${gameId}/screenshots?key=${process.env.RAWG_API_KEY}`,
      { cache: "no-store" }
    );

    const data = await res.json();
    return data.results?.slice(0, 8) || [];
  } catch {
    return [];
  }
}

async function getRawgMovies(gameId?: number): Promise<RawgMovie[]> {
  if (!gameId) return [];

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${gameId}/movies?key=${process.env.RAWG_API_KEY}`,
      { cache: "no-store" }
    );

    const data = await res.json();
    return data.results?.slice(0, 2) || [];
  } catch {
    return [];
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

function PersonalFitSection({ context }: { context: RecommendFitContext | null }) {
  if (!context) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
        <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Personal fit</p>
        <h2 className="mt-4 text-3xl font-black">We don&apos;t know your taste yet</h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
          GamePing learns from the kinds of games, moods, and experiences you search for. Start a
          recommendation search to unlock personalized picks and smarter game matches.
        </p>
        <p className="mt-4 text-sm text-white/40">
          Personalized game matching becomes smarter as you search.
        </p>
        <div className="mt-8">
          <Link
            href="/recommend"
            className="inline-flex rounded-full bg-white px-8 py-4 text-base font-black text-black shadow-[0_0_24px_rgba(255,255,255,0.1)] transition hover:bg-cyan-100"
          >
            Find games for me
          </Link>
        </div>
      </div>
    );
  }

  const tierLabel = recommendMatchTierLabel(context.matchTier);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
      <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Personal fit</p>
      <h2 className="mt-4 text-3xl font-black">Why this fits your vibe</h2>

      {(tierLabel || context.match !== undefined) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tierLabel ? (
            <span
              className={
                context.matchTier === "best_match"
                  ? "rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200"
                  : context.matchTier === "good_alternative"
                    ? "rounded-full bg-amber-500/25 px-3 py-1 text-xs font-bold text-amber-200"
                    : "rounded-full bg-orange-500/25 px-3 py-1 text-xs font-bold text-orange-200"
              }
            >
              {tierLabel}
            </span>
          ) : null}
          {context.match !== undefined ? (
            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-bold text-purple-300">
              {context.match}% match
            </span>
          ) : null}
        </div>
      )}

      {context.matchNote ? (
        <p className="mt-4 text-sm leading-6 text-white/50">{context.matchNote}</p>
      ) : null}

      <p className="mt-5 text-lg leading-8 text-white/70">{context.reason}</p>

      <p className="mt-6 text-xs text-white/35">
        Based on your latest recommendation search — not a saved taste profile yet.
      </p>
    </div>
  );
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
          {formatAggregatorPriceLine({
            price: deal.normalPrice,
            currency: deal.currency,
          })}
        </p>
      </div>

      <p className="text-2xl font-black text-cyan-300">
        {formatAggregatorPriceLine({
          price: deal.salePrice,
          currency: deal.currency,
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

  const rawg = await getRawgGame(title);
  const gameId = rawg?.id;

  const settled = await Promise.allSettled([
    getRawgScreenshots(gameId),
    getRawgMovies(gameId),
    lookupBestPrice({
      title,
      debug: pricingDebug,
      debugLabel: `page:/game/${slug}:bestPrice`,
    }),
    lookupDeals({
      title,
      limit: 5,
      debug: pricingDebug,
      debugLabel: `page:/game/${slug}:deals`,
      rawgStores: rawg?.stores,
    }),
  ]);

  const screenshots =
    settled[0].status === "fulfilled" ? settled[0].value : [];
  const movies = settled[1].status === "fulfilled" ? settled[1].value : [];
  const bestPrice =
    settled[2].status === "fulfilled" ? settled[2].value : null;
  const dealsLookup =
    settled[3].status === "fulfilled"
      ? settled[3].value
      : { deals: [], lastCheckedAt: null, fromCache: false };
  const deals = dealsLookup.deals;
  const dealsLastCheckedAt = dealsLookup.lastCheckedAt;

  const pricingMode = derivePricingUiMode(bestPrice, rawg);

  const {
    primaryDeal,
    otherTrustedDeals,
    trustedOffers,
    untrustedDeals: untrustedAcceptedDeals,
  } = await buildUnifiedTrustedVerifiedOffers({
    requestedTitle: title,
    displayDeals: deals,
    bestPrice,
    debug: pricingDebug,
    debugLabel: `page:/game/${slug}:unified`,
  });

  const primaryTrustedBuyUrl =
    primaryDeal?.deal.url?.trim() ? primaryDeal.deal.url.trim() : undefined;

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

  return (
    <main className="min-h-screen bg-[#05060f] text-white">
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
        <div className="absolute left-10 top-20 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
          <nav
            className="flex max-w-3xl flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65"
            aria-label="Explore GamePing"
          >
            <Link
              href="/"
              className="rounded-lg px-2 py-1 transition hover:bg-white/10 hover:text-cyan-200"
            >
              Home
            </Link>
            <span className="text-white/25" aria-hidden="true">
              ·
            </span>
            <Link
              href="/games"
              className="rounded-lg px-2 py-1 transition hover:bg-white/10 hover:text-cyan-200"
            >
              Games directory
            </Link>
            <span className="text-white/25" aria-hidden="true">
              ·
            </span>
            <Link
              href="/curated"
              className="rounded-lg px-2 py-1 transition hover:bg-white/10 hover:text-cyan-200"
            >
              Curated lists
            </Link>
            <span className="text-white/25" aria-hidden="true">
              ·
            </span>
            <Link
              href="/recommend"
              className="rounded-lg px-2 py-1 transition hover:bg-white/10 hover:text-cyan-200"
            >
              AI recommendations
            </Link>
          </nav>

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
                {pricingMode === "free_to_play" ? (
                  <span className="rounded-full bg-white/10 px-8 py-4 font-bold text-white/60">
                    Free-to-play title
                  </span>
                ) : hasTrustedVerifiedBuy ? (
                  <a
                    href={primaryTrustedBuyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-cyan-400 px-8 py-4 text-base font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.35)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
                  >
                    {primaryDeal
                      ? `Buy on ${primaryDeal.store.name || "store"}`
                      : `Buy on ${bestPrice?.store?.name || "store"}`}
                  </a>
                ) : pricingMode === "verified_price" && hasVerifiedStoreListings ? (
                  <a
                    href="#verified-store-deals"
                    className="rounded-full bg-cyan-400 px-8 py-4 text-base font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.35)] transition hover:-translate-y-0.5 hover:bg-cyan-300"
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
                    No verified pricing available
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
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-400/20 to-purple-600/20 blur-2xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur">
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-stretch">
                    <div className="flex min-h-[13.5rem] flex-col rounded-2xl bg-black/30 p-4 sm:min-h-[14.5rem]">
                      <p className="shrink-0 text-xs uppercase tracking-widest text-white/40">
                        {hasTrustedVerifiedBuy
                          ? "Best verified store price"
                          : "Estimated aggregator price"}
                      </p>
                      <div className="mt-3 flex min-h-0 flex-1 flex-col justify-start gap-2">
                        {pricingMode === "free_to_play" ? (
                          <>
                            <p className="text-2xl font-black text-cyan-300">Free to play</p>
                            <p className="text-xs leading-relaxed text-white/45">
                              This game is listed as free-to-play where supported.
                            </p>
                          </>
                        ) : hasTrustedVerifiedBuy && primaryDeal ? (
                          <>
                            <p className="text-2xl font-black text-cyan-300">
                              {formatAggregatorPriceLine({
                                price: primaryDeal.salePrice,
                                currency: primaryDeal.currency,
                              })}
                            </p>
                            <p className="text-xs leading-relaxed text-white/45">
                              {primaryDeal.store.name || "Store"} · {primaryDeal.matchedTitle}
                            </p>
                            <p className="text-xs text-white/35">{AGGREGATOR_PRICE_DISCLAIMER}</p>
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
                              {formatAggregatorPriceLine({
                                price: bestPrice.price,
                                currency: bestPrice.currency,
                              })}
                            </p>
                            <p className="text-xs text-white/40">{AGGREGATOR_PRICE_DISCLAIMER}</p>
                          </>
                        ) : pricingMode === "likely_console_or_unsupported" ? (
                          <>
                            <p className="text-2xl font-black text-cyan-300">Pricing unavailable</p>
                            <p className="text-xs leading-relaxed text-white/45">
                              Verified PC store pricing may not be available for this platform.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-2xl font-black text-cyan-300">Pricing unavailable</p>
                            <p className="text-xs leading-relaxed text-white/45">
                              We could not verify pricing from supported deal providers.
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex min-h-[13.5rem] flex-col rounded-2xl bg-black/30 p-4 sm:min-h-[14.5rem]">
                      <p className="shrink-0 text-xs uppercase tracking-widest text-white/40">
                        Rating
                      </p>
                      <div className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center text-center">
                        <p className="text-2xl font-black leading-none text-yellow-300 sm:text-3xl">
                          {rawg?.rating ? `${rawg.rating}/5` : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-h-[13.5rem] flex-col rounded-2xl bg-black/30 p-4 sm:min-h-[14.5rem]">
                      <p className="shrink-0 text-xs uppercase tracking-widest text-white/40">
                        Metacritic
                      </p>
                      <div className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center text-center">
                        <p className="text-2xl font-black leading-none text-green-300 sm:text-3xl">
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
              {rawg?.released || "N/A"}
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

          <PersonalFitSection context={recommendFitContext} />

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
              <p className="mt-6 text-white/55">
                Free-to-play titles are distributed through first-party clients. We do not show empty
                verified deal rows here.
              </p>
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
                            ? formatAggregatorPriceLine({
                                price: primaryDeal.salePrice,
                                currency: primaryDeal.currency,
                              })
                            : bestPrice
                              ? formatAggregatorPriceLine({
                                  price: bestPrice.price,
                                  currency: bestPrice.currency,
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
                          : "We could not verify store rows from supported deal providers for this title."}
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
              <DetailRow label="Release date" value={rawg?.released} />
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

          <div className="sticky top-6 rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-7">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">
              {hasTrustedVerifiedBuy ? "Best verified store price" : "Estimated aggregator price"}
            </p>
            <h2 className="mt-4 text-4xl font-black">
              {pricingMode === "free_to_play"
                ? "Free to play"
                : hasTrustedVerifiedBuy && primaryDeal
                  ? formatAggregatorPriceLine({
                      price: primaryDeal.salePrice,
                      currency: primaryDeal.currency,
                    })
                  : showEstimatedPriceNoStoreLinks && bestPrice
                    ? "Estimated price found"
                    : pricingMode === "verified_price" &&
                        bestPrice?.price &&
                        bestPrice.price !== "N/A"
                      ? formatAggregatorPriceLine({
                          price: bestPrice.price,
                          currency: bestPrice.currency,
                        })
                      : "Pricing unavailable"}
            </h2>
            <p className="mt-2 text-xs text-white/45">{AGGREGATOR_PRICE_DISCLAIMER}</p>
            <p className="mt-4 text-white/65">
              {pricingMode === "free_to_play"
                ? "This game is listed as free-to-play where supported."
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
                            : "We could not verify pricing from supported deal providers."}
            </p>

            <TrackPriceButton
              title={rawg?.name || title}
              rawgId={rawg?.id ?? null}
              baselinePrice={trackBaselinePrice}
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