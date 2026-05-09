import "server-only"

import { createClient } from "@supabase/supabase-js"

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

