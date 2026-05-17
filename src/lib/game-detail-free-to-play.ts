import "server-only";

import { steamFetchAppDetails } from "@/lib/pricing/providers/steam";
import { resolveTrustedSteamAppId } from "@/lib/pricing/steam-app-id";
import type { VerifiedDealRow } from "@/lib/pricing/verified-deal-row";

export type RawgGameForF2P = {
  genres?: { name: string }[];
  tags?: { name: string }[];
  stores?: { store?: { slug?: string; name?: string }; url?: string }[];
};

export type GameDetailFreeToPlayResult = {
  isFreeToPlay: boolean;
  storeUrl?: string;
  signal?: "steam" | "verified_zero" | "rawg_tags";
};

function parseVerifiedZeroPrice(deal: VerifiedDealRow): number | null {
  const raw = String(deal.salePrice ?? "").trim();
  if (/^free$/i.test(raw)) return 0;
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function findVerifiedZeroPriceOffer(
  deals: VerifiedDealRow[]
): { url: string } | null {
  for (const deal of deals) {
    const url = deal.deal.url?.trim();
    if (!url) continue;
    const price = parseVerifiedZeroPrice(deal);
    if (price === 0) return { url };
  }
  return null;
}

/** RAWG genres/tags that explicitly say free-to-play (not weak genre guesses). */
export function rawgTagsIndicateFreeToPlay(rawg: RawgGameForF2P | null): boolean {
  if (!rawg) return false;
  const parts: string[] = [];
  for (const g of rawg.genres ?? []) {
    if (g?.name) parts.push(g.name);
  }
  for (const t of rawg.tags ?? []) {
    if (t?.name) parts.push(t.name);
  }
  const blob = parts.join(" ").toLowerCase();
  return /\bfree[\s-]?to[\s-]?play\b/.test(blob);
}

/**
 * Reliable free-to-play signals for game detail UI (no AI, no title allowlist).
 * Order: Steam is_free → verified offer at $0 → RAWG free-to-play tags.
 */
export async function resolveGameDetailFreeToPlay(params: {
  title: string;
  rawg: RawgGameForF2P | null;
  trustedOffers: VerifiedDealRow[];
  cheapsharkSteamAppId?: string | null;
}): Promise<GameDetailFreeToPlayResult> {
  const steamResolved = resolveTrustedSteamAppId({
    title: params.title,
    rawgStores: params.rawg?.stores,
    cheapsharkSteamAppId: params.cheapsharkSteamAppId,
  });

  let steamQuote: Awaited<ReturnType<typeof steamFetchAppDetails>> = null;
  if (steamResolved) {
    steamQuote = await steamFetchAppDetails(steamResolved.appId);
    if (steamQuote?.isFree === true) {
      return {
        isFreeToPlay: true,
        storeUrl: steamQuote.storeUrl,
        signal: "steam",
      };
    }
  }

  const zeroOffer = findVerifiedZeroPriceOffer(params.trustedOffers);
  if (zeroOffer) {
    return {
      isFreeToPlay: true,
      storeUrl: zeroOffer.url,
      signal: "verified_zero",
    };
  }

  if (rawgTagsIndicateFreeToPlay(params.rawg)) {
    return {
      isFreeToPlay: true,
      storeUrl: steamQuote?.storeUrl,
      signal: "rawg_tags",
    };
  }

  return { isFreeToPlay: false };
}
