/**
 * Human-readable price lines for aggregator-sourced data (region/store may vary).
 */

export function formatAggregatorPriceLine(params: {
  price: string;
  currency?: string | null;
}): string {
  const { price, currency } = params;
  const p = (price || "").trim();
  if (!p || p === "N/A") return "Price unavailable";
  if (/^free$/i.test(p)) return "Free";
  const cur = (currency || "").trim().toUpperCase() || "USD";
  if (cur === "USD") {
    return `Approx. $${p} USD`;
  }
  return `Approx. ${p} ${cur}`;
}

export const AGGREGATOR_PRICE_DISCLAIMER =
  "May vary by region/store.";
