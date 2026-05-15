import "server-only"

import { createClient } from "@supabase/supabase-js"
import type { VerifiedDealRow } from "@/lib/pricing/verified-deal-row"

export type PriceQuoteRow = {
  id: string
  title: string
  provider: string
  matched_title: string | null
  price: number | null
  currency: string | null
  store_name: string | null
  deal_url: string | null
  fetched_at: string
  expires_at: string
  raw_payload: unknown | null
}

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000

/** Fresh deal-list TTL (30–60 min window). */
export const DEAL_QUOTES_FRESH_TTL_MS = 45 * 60 * 1000

/** Stale deal-list fallback when providers fail or rate-limit (12–24 h). */
export const DEAL_QUOTES_STALE_MAX_MS = 24 * 60 * 60 * 1000

export type DealQuotesCacheMeta = {
  source?: "live" | "fresh_cache" | "stale_cache"
  provider?: string
  rateLimited?: boolean
}

export type DealQuotesCacheRow = {
  id: string
  normalized_title: string
  title: string
  deals: unknown
  provider: string
  debug_meta: DealQuotesCacheMeta | null
  created_at: string
  updated_at: string
  expires_at: string
}

export type GetCachedDealQuotesResult = {
  fresh: boolean
  stale: boolean
  row: DealQuotesCacheRow | null
  deals: VerifiedDealRow[]
  updatedAt: string | null
}

function getCacheClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for price cache")
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export function normalizePriceCacheKeyTitle(title: string) {
  return (title || "").trim().toLowerCase()
}

/** Alias for deal-list cache keys (same normalization as single price quotes). */
export function normalizePricingCacheTitle(title: string) {
  return normalizePriceCacheKeyTitle(title)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v)
}

/** VerifiedDealRow currently only supports CheapShark-shaped listings. */
function isCheapSharkCompatibleDealShape(dealId: string, dealUrl?: string): boolean {
  const url = (dealUrl ?? "").trim().toLowerCase()
  if (url.includes("cheapshark.com/redirect") || url.includes("dealid=")) return true
  if (!url && /^\d+$/.test(dealId)) return true
  return false
}

/**
 * Resolve provider for cached rows. Never returns null — incompatible rows should be skipped by caller.
 */
function resolveCachedVerifiedDealProvider(
  item: Record<string, unknown>,
  dealId: string,
  dealUrl?: string
): "cheapshark" | null {
  const raw = item.provider
  if (raw === "itad" || raw === "mixed") return null
  if (raw === "cheapshark") return "cheapshark"
  if (isCheapSharkCompatibleDealShape(dealId, dealUrl)) return "cheapshark"
  return null
}

/**
 * Structural parse only — caller should re-run pricing gates before display when serving stale rows.
 * Never returns rows that were stored without acceptedPrice or with untrusted URLs.
 */
export function parseVerifiedDealsFromCacheJson(raw: unknown): VerifiedDealRow[] {
  if (!Array.isArray(raw)) return []

  const out: VerifiedDealRow[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue

    const requestedTitle = typeof item.requestedTitle === "string" ? item.requestedTitle.trim() : ""
    const matchedTitle = typeof item.matchedTitle === "string" ? item.matchedTitle.trim() : ""
    const currency = typeof item.currency === "string" ? item.currency : "USD"
    const salePrice = typeof item.salePrice === "string" ? item.salePrice : ""
    const normalPrice = typeof item.normalPrice === "string" ? item.normalPrice : ""

    const storeRaw = item.store
    if (!isRecord(storeRaw)) continue
    const storeId = typeof storeRaw.id === "string" ? storeRaw.id : ""
    if (!storeId) continue
    const storeName = typeof storeRaw.name === "string" ? storeRaw.name : undefined

    const dealRaw = item.deal
    if (!isRecord(dealRaw)) continue
    const dealId = typeof dealRaw.id === "string" ? dealRaw.id : ""
    if (!dealId) continue
    const dealUrl =
      typeof dealRaw.url === "string" && dealRaw.url.trim() ? dealRaw.url.trim() : undefined

    const gateRaw = item.gate
    if (!isRecord(gateRaw)) continue
    if (gateRaw.acceptedPrice !== true) continue
    const trustedUrl = gateRaw.trustedUrl === true
    if (dealUrl && !trustedUrl) continue
    if (!dealUrl && trustedUrl) continue

    const score = typeof gateRaw.score === "number" && Number.isFinite(gateRaw.score) ? gateRaw.score : 0
    const reason = typeof gateRaw.reason === "string" ? gateRaw.reason : ""
    const requestedNorm =
      typeof gateRaw.requestedNorm === "string" ? gateRaw.requestedNorm : ""
    const matchedNorm = typeof gateRaw.matchedNorm === "string" ? gateRaw.matchedNorm : ""
    const isShortTitle = gateRaw.isShortTitle === true

    if (!requestedTitle || !matchedTitle || !salePrice) continue

    const provider = resolveCachedVerifiedDealProvider(item, dealId, dealUrl)
    if (!provider) continue

    out.push({
      requestedTitle,
      matchedTitle,
      provider,
      currency,
      store: { id: storeId, name: storeName },
      salePrice,
      normalPrice,
      deal: { id: dealId, url: trustedUrl ? dealUrl : undefined },
      gate: {
        score,
        acceptedPrice: true,
        trustedUrl,
        reason,
        requestedNorm,
        matchedNorm,
        isShortTitle,
      },
    })
  }

  return out
}

async function fetchDealQuotesRow(
  normalizedTitle: string
): Promise<DealQuotesCacheRow | null> {
  try {
    const supabase = getCacheClient()
    const { data, error } = await supabase
      .from("deal_quotes_cache")
      .select(
        "id,normalized_title,title,deals,provider,debug_meta,created_at,updated_at,expires_at"
      )
      .eq("normalized_title", normalizedTitle)
      .maybeSingle()

    if (error || !data) return null
    return data as DealQuotesCacheRow
  } catch {
    return null
  }
}

function classifyDealQuotesRow(
  row: DealQuotesCacheRow,
  now: Date
): { fresh: boolean; stale: boolean } {
  const nowMs = now.getTime()
  const expiresMs = Date.parse(row.expires_at)
  const updatedMs = Date.parse(row.updated_at)
  const fresh = Number.isFinite(expiresMs) && expiresMs > nowMs
  const stale =
    !fresh &&
    Number.isFinite(updatedMs) &&
    nowMs - updatedMs <= DEAL_QUOTES_STALE_MAX_MS
  return { fresh, stale }
}

export async function getCachedDealQuotes(
  title: string,
  options?: { now?: Date }
): Promise<GetCachedDealQuotesResult> {
  const key = normalizePricingCacheTitle(title)
  const empty: GetCachedDealQuotesResult = {
    fresh: false,
    stale: false,
    row: null,
    deals: [],
    updatedAt: null,
  }
  if (!key) return empty

  const row = await fetchDealQuotesRow(key)
  if (!row) return empty

  const { fresh, stale } = classifyDealQuotesRow(row, options?.now ?? new Date())
  if (!fresh && !stale) return empty

  const deals = parseVerifiedDealsFromCacheJson(row.deals)
  return {
    fresh,
    stale: stale && !fresh,
    row,
    deals,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  }
}

/** Expired rows within stale window (provider fallback). */
export async function getStaleDealQuotes(
  title: string,
  options?: { now?: Date }
): Promise<GetCachedDealQuotesResult> {
  const cached = await getCachedDealQuotes(title, options)
  if (!cached.row || cached.fresh || !cached.stale) {
    return { fresh: false, stale: false, row: null, deals: [], updatedAt: null }
  }
  return cached
}

export async function setCachedDealQuotes(params: {
  title: string
  deals: VerifiedDealRow[]
  provider?: string
  meta?: DealQuotesCacheMeta | null
  ttlMs?: number
  now?: Date
}): Promise<boolean> {
  const normalized = normalizePricingCacheTitle(params.title)
  const displayTitle = (params.title || "").trim()
  if (!normalized || !displayTitle) return false

  const safeDeals = params.deals.filter(
    (d) =>
      d.gate.acceptedPrice === true &&
      (!d.deal.url || d.gate.trustedUrl === true)
  )
  if (!safeDeals.length) return false

  try {
    const supabase = getCacheClient()
    const now = params.now ?? new Date()
    const ttlMs =
      typeof params.ttlMs === "number" ? params.ttlMs : DEAL_QUOTES_FRESH_TTL_MS

    const row = {
      normalized_title: normalized,
      title: displayTitle,
      deals: safeDeals,
      provider: params.provider ?? "cheapshark",
      debug_meta: params.meta ?? null,
      expires_at: new Date(now.getTime() + ttlMs).toISOString(),
    }

    const { error } = await supabase
      .from("deal_quotes_cache")
      .upsert(row, { onConflict: "normalized_title" })

    return !error
  } catch {
    return false
  }
}

export async function getCachedPriceQuote(params: {
  title: string
  now?: Date
}): Promise<{ hit: boolean; expired: boolean; row: PriceQuoteRow | null }> {
  const keyTitle = normalizePriceCacheKeyTitle(params.title)
  if (!keyTitle) return { hit: false, expired: false, row: null }

  try {
    const supabase = getCacheClient()
    const nowIso = (params.now ?? new Date()).toISOString()

    // We keep expired rows for debugging/inspection; we just don't serve them.
    const { data, error } = await supabase
      .from("price_quotes")
      .select(
        "id,title,provider,matched_title,price,currency,store_name,deal_url,fetched_at,expires_at,raw_payload"
      )
      .eq("title", keyTitle)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return { hit: false, expired: false, row: null }

    const expiresAt = typeof data.expires_at === "string" ? data.expires_at : null
    const expired = Boolean(expiresAt && expiresAt < nowIso)
    return { hit: !expired, expired, row: (data as PriceQuoteRow) ?? null }
  } catch {
    // Best-effort: cache failures must not break details page.
    return { hit: false, expired: false, row: null }
  }
}

export async function setCachedPriceQuote(params: {
  title: string
  provider: string
  matchedTitle?: string | null
  price: number
  currency?: string | null
  storeName?: string | null
  dealUrl?: string | null
  rawPayload?: unknown | null
  ttlMs?: number
  now?: Date
}): Promise<boolean> {
  const keyTitle = normalizePriceCacheKeyTitle(params.title)
  if (!keyTitle) return false
  if (!Number.isFinite(params.price) || params.price <= 0) return false

  try {
    const supabase = getCacheClient()
    const now = params.now ?? new Date()
    const ttlMs = typeof params.ttlMs === "number" ? params.ttlMs : DEFAULT_TTL_MS

    const row = {
      title: keyTitle,
      provider: params.provider,
      matched_title: params.matchedTitle ?? null,
      price: params.price,
      currency: params.currency ?? null,
      store_name: params.storeName ?? null,
      deal_url: params.dealUrl ?? null,
      fetched_at: now.toISOString(),
      expires_at: new Date(now.getTime() + ttlMs).toISOString(),
      raw_payload: params.rawPayload ?? null,
    }

    const { error } = await supabase.from("price_quotes").upsert(row, { onConflict: "title" })
    return !error
  } catch {
    return false
  }
}

