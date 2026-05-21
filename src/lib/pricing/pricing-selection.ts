import type { VerifiedDealRow } from "@/lib/pricing/verified-deal-row";
import { preferredCurrencyForCountry } from "@/lib/pricing/pricing-region";

export function normalizeOfferCurrency(currency: string | null | undefined): string {
  const c = (currency || "").trim().toUpperCase();
  return c || "USD";
}

export function isUsdFallbackProvider(provider: VerifiedDealRow["provider"]): boolean {
  return provider === "cheapshark";
}

function parseSaleAmount(deal: VerifiedDealRow): number {
  const n = Number(String(deal.salePrice).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

function trustedDeals(deals: VerifiedDealRow[]): VerifiedDealRow[] {
  return deals.filter(
    (d) => Boolean(d.deal.url?.trim()) && !Number.isNaN(parseSaleAmount(d))
  );
}

function pickMinInCurrency(
  deals: VerifiedDealRow[],
  currency: string
): VerifiedDealRow | null {
  const cur = currency.toUpperCase();
  const pool = trustedDeals(deals).filter(
    (d) => normalizeOfferCurrency(d.currency) === cur
  );
  if (!pool.length) return null;
  return pool.reduce((best, row) =>
    parseSaleAmount(row) < parseSaleAmount(best) ? row : best
  );
}

/**
 * Pick cheapest trusted offer without cross-currency numeric compare.
 * Prefers Steam/ITAD in the visitor's regional currency; CheapShark USD is fallback only.
 */
export function pickCheapestTrustedVerifiedDeal(
  deals: VerifiedDealRow[],
  options?: { countryCode?: string | null }
): VerifiedDealRow | null {
  const trusted = trustedDeals(deals);
  if (!trusted.length) return null;

  const regional = trusted.filter((d) => !isUsdFallbackProvider(d.provider));
  const preferred = preferredCurrencyForCountry(options?.countryCode ?? "US");

  if (regional.length && preferred) {
    const inPreferred = pickMinInCurrency(regional, preferred);
    if (inPreferred) return inPreferred;
  }

  if (regional.length) {
    const byCurrency = new Map<string, VerifiedDealRow[]>();
    for (const row of regional) {
      const cur = normalizeOfferCurrency(row.currency);
      const list = byCurrency.get(cur) ?? [];
      list.push(row);
      byCurrency.set(cur, list);
    }
    let best: VerifiedDealRow | null = null;
    let bestAmount = Infinity;
    for (const rows of byCurrency.values()) {
      const min = rows.reduce((a, b) =>
        parseSaleAmount(a) < parseSaleAmount(b) ? a : b
      );
      const amt = parseSaleAmount(min);
      if (amt < bestAmount) {
        bestAmount = amt;
        best = min;
      }
    }
    if (best) return best;
  }

  const usdFallback = trusted.filter((d) => isUsdFallbackProvider(d.provider));
  if (usdFallback.length) {
    return usdFallback.reduce((best, row) =>
      parseSaleAmount(row) < parseSaleAmount(best) ? row : best
    );
  }

  return trusted.reduce((best, row) =>
    parseSaleAmount(row) < parseSaleAmount(best) ? row : best
  );
}
