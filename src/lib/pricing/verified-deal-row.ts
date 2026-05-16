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

/** Canonical URL for listing identity (Steam app id, CheapShark deal id, etc.). */
export function normalizeDealUrlForListingIdentity(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "store.steampowered.com" || host.endsWith(".steampowered.com")) {
      const appMatch = u.pathname.match(/\/app\/(\d+)/i);
      if (appMatch?.[1]) return `steam:app:${appMatch[1]}`;
    }

    if (host === "cheapshark.com" || host.endsWith(".cheapshark.com")) {
      const dealId = u.searchParams.get("dealid") ?? u.searchParams.get("dealID");
      if (dealId) return `cheapshark:deal:${dealId}`;
    }

    const path = u.pathname.replace(/\/+$/, "") || "/";
    return `${host}${path}`;
  } catch {
    return trimmed.toLowerCase();
  }
}

/** Listing URL slot for dedupe (Steam redirect vs store URL → same merchant listing). */
export function verifiedDealListingUrlSlot(deal: VerifiedDealRow): string {
  if (verifiedDealMerchantIdentity(deal) === "steam") {
    return "steam:listing";
  }
  return normalizeDealUrlForListingIdentity(deal.deal.url);
}

/**
 * Same real store listing across providers (merchant + title + price + canonical URL).
 * Provider is intentionally excluded so Steam API + CheapShark Steam rows collapse.
 */
export function verifiedDealListingIdentityKey(deal: VerifiedDealRow): string {
  return [
    verifiedDealMerchantIdentity(deal),
    deal.matchedTitle.trim().toLowerCase(),
    String(deal.salePrice).trim(),
    verifiedDealListingUrlSlot(deal),
  ].join("|");
}

/** @deprecated alias — use verifiedDealListingIdentityKey */
export function verifiedDealDisplayDedupeKey(deal: VerifiedDealRow): string {
  return verifiedDealListingIdentityKey(deal);
}

/** Higher = preferred row when two providers resolve to the same listing. */
export function verifiedOfferRowKeepPriority(deal: VerifiedDealRow): number {
  if (deal.provider === "itad") return 3;
  if (deal.provider === "steam") return 2;
  if (deal.provider === "cheapshark") return 1;
  return 0;
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

/** True when row is the same listing as primary for UI (merchant + title + price + URL). */
export function isSameVerifiedOfferAsPrimary(
  row: VerifiedDealRow,
  primary: VerifiedDealRow
): boolean {
  return verifiedDealListingIdentityKey(row) === verifiedDealListingIdentityKey(primary);
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
