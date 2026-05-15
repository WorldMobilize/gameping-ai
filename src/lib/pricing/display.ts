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

/** Relative “last checked” line for cached deal lists on game detail. */
export function formatDealsLastCheckedLabel(iso: string): string | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60_000));
  if (mins < 1) return "Prices last checked just now";
  if (mins < 60) return `Prices last checked ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Prices last checked ${hours}h ago`;
  return "Prices last checked recently";
}
