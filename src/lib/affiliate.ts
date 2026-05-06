import { STORES } from "./stores"

const CHEAPSHARK_REDIRECT_BASE = "https://www.cheapshark.com/redirect"

function getCheapSharkUrl(dealID?: string | null) {
  if (!dealID) return null
  return `${CHEAPSHARK_REDIRECT_BASE}?dealID=${encodeURIComponent(dealID)}`
}

export function getAffiliateUrl({
  storeID,
  dealID,
  rawUrl,
}: {
  storeID?: string | number | null
  dealID?: string | null
  rawUrl?: string | null
}) {
  const id = String(storeID ?? "")
  const store = STORES[id]

  // 🔥 se abbiamo URL diretto e store supporta affiliate
  if (rawUrl && store?.hasAffiliate && store.buildUrl) {
    return store.buildUrl(rawUrl)
  }

  // 🧯 fallback CheapShark
  const cheapUrl = getCheapSharkUrl(dealID)

  return cheapUrl || rawUrl || "/"
}