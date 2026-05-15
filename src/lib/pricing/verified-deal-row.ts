export type VerifiedDealRow = {
  requestedTitle: string;
  matchedTitle: string;
  provider: "cheapshark";
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
