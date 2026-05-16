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

/** Normalized merchant for primary-vs-other exclusion (CheapShark Steam id "1" = steam). */
export function verifiedDealMerchantIdentity(deal: VerifiedDealRow): string {
  const id = deal.store.id.trim().toLowerCase();
  const name = (deal.store.name ?? "").trim().toLowerCase();

  if (id === "1" || id === "steam" || name === "steam") return "steam";
  if (name.includes("humble") || id.includes("humble")) return "humble";
  if (name.includes("gog") || id.includes("gog")) return "gog";
  if (name.includes("epic") || id.includes("epic")) return "epic";
  if (name) return name;
  return id || "unknown";
}

/** True when row is the same listing as primary for UI (exact key or same merchant+title+price). */
export function isSameVerifiedOfferAsPrimary(
  row: VerifiedDealRow,
  primary: VerifiedDealRow
): boolean {
  if (verifiedDealDisplayDedupeKey(row) === verifiedDealDisplayDedupeKey(primary)) {
    return true;
  }

  const rowPrice = Number(String(row.salePrice).replace(/[^0-9.]/g, ""));
  const primaryPrice = Number(String(primary.salePrice).replace(/[^0-9.]/g, ""));
  if (
    !Number.isFinite(rowPrice) ||
    !Number.isFinite(primaryPrice) ||
    rowPrice !== primaryPrice
  ) {
    return false;
  }

  if (row.matchedTitle.trim().toLowerCase() !== primary.matchedTitle.trim().toLowerCase()) {
    return false;
  }

  return verifiedDealMerchantIdentity(row) === verifiedDealMerchantIdentity(primary);
}

export type VerifiedDealRow = {
  requestedTitle: string;
  matchedTitle: string;
  provider: "cheapshark" | "steam" | "itad";
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
