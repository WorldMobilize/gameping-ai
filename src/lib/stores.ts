export type StoreConfig = {
  id: string
  name: string
  hasAffiliate: boolean
  buildUrl?: (rawUrl: string) => string
}

export const STORES: Record<string, StoreConfig> = {
  "1": {
    id: "1",
    name: "Steam",
    hasAffiliate: false,
  },

  "3": {
    id: "3",
    name: "GreenManGaming",
    hasAffiliate: true,
    buildUrl: (url) =>
      process.env.AFFILIATE_GMG_TAG
        ? `${url}?utm_source=${process.env.AFFILIATE_GMG_TAG}`
        : url,
  },

  "11": {
    id: "11",
    name: "Humble",
    hasAffiliate: true,
    buildUrl: (url) =>
      process.env.AFFILIATE_HUMBLE_PARTNER_ID
        ? `${url}?partner=${process.env.AFFILIATE_HUMBLE_PARTNER_ID}`
        : url,
  },

  "15": {
    id: "15",
    name: "Fanatical",
    hasAffiliate: true,
    buildUrl: (url) =>
      process.env.AFFILIATE_FANATICAL_TAG
        ? `${url}?ref=${process.env.AFFILIATE_FANATICAL_TAG}`
        : url,
  },
}