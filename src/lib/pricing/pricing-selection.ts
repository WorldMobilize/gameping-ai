import type { VerifiedDealRow } from "@/lib/pricing/verified-deal-row";
import {
  fallbackCurrenciesForCountry,
  logRegionalPricingSelection,
  normalizeOfferCurrency,
  scoreRegionalOffer,
} from "@/lib/pricing/pricing-regional";
import { normalizePricingCountry } from "@/lib/pricing/pricing-region";

export { normalizeOfferCurrency } from "@/lib/pricing/pricing-regional";

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

function minOfferPerCurrency(deals: VerifiedDealRow[]): VerifiedDealRow[] {
  const byCurrency = new Map<string, VerifiedDealRow>();
  for (const row of deals) {
    const cur = normalizeOfferCurrency(row.currency);
    const existing = byCurrency.get(cur);
    if (!existing || parseSaleAmount(row) < parseSaleAmount(existing)) {
      byCurrency.set(cur, row);
    }
  }
  return [...byCurrency.values()];
}

/**
 * Pick cheapest trusted offer without cross-currency numeric compare.
 * Walks regional currency chain (e.g. CA: CAD → USD) before global/incompatible currencies.
 */
export function pickCheapestTrustedVerifiedDeal(
  deals: VerifiedDealRow[],
  options?: { countryCode?: string | null; debug?: boolean; source?: string }
): VerifiedDealRow | null {
  const countryCode = normalizePricingCountry(options?.countryCode ?? "US");
  const trusted = trustedDeals(deals);
  if (!trusted.length) return null;

  const regional = trusted.filter((d) => !isUsdFallbackProvider(d.provider));
  const usdFallback = trusted.filter((d) => isUsdFallbackProvider(d.provider));
  const currencyChain = fallbackCurrenciesForCountry(countryCode);
  const usdPick = pickMinInCurrency(usdFallback, "USD");

  if (regional.length) {
    const minPerCurrency = minOfferPerCurrency(regional);
    if (!minPerCurrency.length) return null;

    const byCurrency = new Map(
      minPerCurrency.map((row) => [normalizeOfferCurrency(row.currency), row])
    );

    for (const cur of currencyChain) {
      const pick = byCurrency.get(cur);
      if (pick) {
        logRegionalPricingSelection({
          debug: options?.debug,
          source: options?.source ?? "pickCheapest",
          requestedCountry: countryCode,
          selectionReason: "currency_chain",
          currency: cur,
          provider: pick.provider,
          store: pick.store.name ?? pick.store.id,
          salePrice: pick.salePrice,
          currencyTier: cur === currencyChain[0] ? "preferred" : "fallback",
        });
        return pick;
      }
    }

    if (usdPick && currencyChain.includes("USD")) {
      logRegionalPricingSelection({
        debug: options?.debug,
        source: options?.source ?? "pickCheapest",
        requestedCountry: countryCode,
        selectionReason: "usd_fallback_before_global",
        provider: usdPick.provider,
        store: usdPick.store.name ?? usdPick.store.id,
        salePrice: usdPick.salePrice,
        currency: "USD",
        currencyTier: "fallback",
      });
      return usdPick;
    }

    const globalPool = minPerCurrency.filter(
      (row) => !currencyChain.includes(normalizeOfferCurrency(row.currency))
    );
    if (globalPool.length) {
      const scored = globalPool.map((row) => ({
        row,
        score: scoreRegionalOffer({
          countryCode,
          currency: row.currency,
          storeName: row.store.name,
          provider: row.provider,
        }),
      }));
      scored.sort((a, b) => b.score - a.score);
      const topScore = scored[0]?.score ?? -Infinity;
      const topTier = scored.filter((s) => s.score === topScore);

      let pick = topTier[0]?.row ?? null;
      if (topTier.length > 1 && pick) {
        const pickCur = normalizeOfferCurrency(pick.currency);
        const sameCurrency = topTier.filter(
          (s) => normalizeOfferCurrency(s.row.currency) === pickCur
        );
        pick = sameCurrency.reduce((best, s) =>
          parseSaleAmount(s.row) < parseSaleAmount(best.row) ? s : best
        ).row;
      }

      if (pick) {
        logRegionalPricingSelection({
          debug: options?.debug,
          source: options?.source ?? "pickCheapest",
          requestedCountry: countryCode,
          selectionReason: "global_regional_score",
          provider: pick.provider,
          store: pick.store.name ?? pick.store.id,
          salePrice: pick.salePrice,
          currency: pick.currency,
          currencyTier: "global",
          regionalScore: topScore,
        });
        return pick;
      }
    }
  }

  if (usdPick) {
    logRegionalPricingSelection({
      debug: options?.debug,
      source: options?.source ?? "pickCheapest",
      requestedCountry: countryCode,
      selectionReason: "cheapshark_usd_fallback",
      provider: usdPick.provider,
      store: usdPick.store.name ?? usdPick.store.id,
      salePrice: usdPick.salePrice,
      currency: "USD",
      currencyTier: "fallback",
    });
    return usdPick;
  }

  return null;
}
