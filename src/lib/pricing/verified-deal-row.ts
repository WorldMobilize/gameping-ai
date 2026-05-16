/** Stable store identity for dedupe / UI comparisons (id preferred, then name). */
export function verifiedDealStoreIdentity(deal: {
  store: { id: string; name?: string };
}): string {
  const id = deal.store.id.trim().toLowerCase();
  if (id) return `id:${id}`;
  const name = deal.store.name?.trim().toLowerCase();
  if (name) return `name:${name}`;
  return "unknown";
}

/**
 * Dedupe key for display rows: only collapse true duplicates (same provider + store + listing + price + URL).
 * Different stores/providers stay separate even when title and sale price match.
 */
export function verifiedDealDisplayDedupeKey(deal: VerifiedDealRow): string {
  const url = (deal.deal.url ?? "").trim().toLowerCase();
  return [
    deal.provider,
    verifiedDealStoreIdentity(deal),
    deal.matchedTitle.trim().toLowerCase(),
    String(deal.salePrice).trim(),
    url,
  ].join("|");
}

export type VerifiedDealRow = {
  requestedTitle: string;
  matchedTitle: string;
  provider: "cheapshark" | "steam";
  currency: string;
  store: { id: string; name?: string };
  salePrice: string;
  normalPrice: string;
  deal: { id: string; url?: string };
  gate: {
    score: number;
    acceptedPrice: boolean;
    trustedUrl: boolean;
    reason: string;
    requestedNorm: string;
    matchedNorm: string;
    isShortTitle: boolean;
  };
};

/** @deprecated use VerifiedDealRow */
export type DealRow = VerifiedDealRow;
