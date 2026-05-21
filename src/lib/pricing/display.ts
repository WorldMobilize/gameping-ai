/**
 * Human-readable price lines for game detail and alert copy.
 */

const SYMBOL_BY_CURRENCY: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  NZD: "NZ$",
  JPY: "¥",
  BRL: "R$",
  MXN: "MX$",
};

export function formatPriceLine(params: {
  price: string;
  currency?: string | null;
  /** CheapShark USD fallback — label as approximate USD. */
  usdFallback?: boolean;
}): string {
  const { price, currency, usdFallback = false } = params;
  const p = (price || "").trim();
  if (!p || p === "N/A") return "Price unavailable";
  if (/^free$/i.test(p)) return "Free";
  const cur = (currency || "").trim().toUpperCase() || "USD";

  if (usdFallback) {
    if (cur === "USD") return `Approx. $${p} USD`;
    return `Approx. ${p} ${cur}`;
  }

  const sym = SYMBOL_BY_CURRENCY[cur];
  if (sym) return `${sym}${p}`;
  return `${p} ${cur}`;
}

/** Approximate aggregator copy (alerts, CheapShark-only fallback). */
export function formatAggregatorPriceLine(params: {
  price: string;
  currency?: string | null;
}): string {
  return formatPriceLine({ ...params, usdFallback: true });
}

export const AGGREGATOR_PRICE_DISCLAIMER =
  "May vary by region/store.";

export function isCheapSharkUsdFallbackProvider(
  provider: string | null | undefined
): boolean {
  return (provider || "").trim().toLowerCase() === "cheapshark";
}

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
