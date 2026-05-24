import type { VerifiedDealRow } from "@/lib/pricing/verified-deal-row";
import { normalizeDealUrlForListingIdentity } from "@/lib/pricing/verified-deal-row";
import type { TrackedOfferSnapshot } from "@/lib/tracked-games-pricing";

export type TrackedOfferSelectionReason =
  | "tracked_url_match"
  | "tracked_store_match"
  | "tracked_provider_store_match"
  | "unified_primary_no_tracked_identity"
  | "tracked_listing_unavailable_rebaseline";

export function hasTrackedOfferIdentity(tracked: TrackedOfferSnapshot): boolean {
  return Boolean(
    tracked.url?.trim() || tracked.storeName?.trim() || tracked.provider?.trim()
  );
}

function normalizeStoreToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Loose match for ITAD store labels (e.g. "GamesPlanet UK" vs "GamesPlanet UK · Title"). */
export function storeNameMatchesOffer(dealStore: string, trackedStore: string): boolean {
  const a = normalizeStoreToken(dealStore);
  const b = normalizeStoreToken(trackedStore);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.startsWith(`${b} `) || a.startsWith(`${b}·`) || b.startsWith(`${a} `)) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

export function findMatchingTrackedOffer(
  offers: VerifiedDealRow[],
  tracked: TrackedOfferSnapshot
): {
  deal: VerifiedDealRow;
  reason: Exclude<
    TrackedOfferSelectionReason,
    "unified_primary_no_tracked_identity" | "tracked_listing_unavailable_rebaseline"
  >;
} | null {
  if (!hasTrackedOfferIdentity(tracked)) return null;

  const trackedUrl = tracked.url?.trim();
  if (trackedUrl) {
    const trackedSlot = normalizeDealUrlForListingIdentity(trackedUrl);
    for (const row of offers) {
      const rowUrl = row.deal.url?.trim();
      if (!rowUrl) continue;
      if (rowUrl === trackedUrl) {
        return { deal: row, reason: "tracked_url_match" };
      }
      if (normalizeDealUrlForListingIdentity(rowUrl) === trackedSlot) {
        return { deal: row, reason: "tracked_url_match" };
      }
    }
  }

  const trackedProvider = tracked.provider?.trim().toLowerCase();
  const trackedStore = tracked.storeName?.trim();
  if (trackedStore) {
    for (const row of offers) {
      const rowStoreLabel = (row.store.name ?? row.store.id ?? "").trim();
      if (!storeNameMatchesOffer(rowStoreLabel, trackedStore)) continue;
      if (trackedProvider && row.provider !== trackedProvider) continue;
      return {
        deal: row,
        reason: trackedProvider ? "tracked_provider_store_match" : "tracked_store_match",
      };
    }
  }

  return null;
}
