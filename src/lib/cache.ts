import "server-only"

import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"

const AI_TTL_MS = 24 * 60 * 60 * 1000
const RAWG_TTL_MS = 7 * 24 * 60 * 60 * 1000

function getCacheClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for cache")
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function stableStringify(value: unknown) {
  const seen = new WeakSet<object>()

  const sortValue = (v: any): any => {
    if (v === null || typeof v !== "object") return v
    if (v instanceof Date) return v.toISOString()
    if (Array.isArray(v)) return v.map(sortValue)
    if (seen.has(v)) return "[Circular]"
    seen.add(v)
    return Object.keys(v)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = sortValue(v[key])
        return acc
      }, {})
  }

  return JSON.stringify(sortValue(value))
}

export function hashNormalizedInput(normalized: unknown) {
  return createHash("sha256").update(stableStringify(normalized)).digest("hex")
}

export async function getCachedAiRecommendation<T>(inputHash: string): Promise<T | null> {
  const supabase = getCacheClient()
  const cutoff = new Date(Date.now() - AI_TTL_MS).toISOString()

  const { data, error } = await supabase
    .from("cached_ai_recommendations")
    .select("response_json, created_at")
    .eq("input_hash", inputHash)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    // Cache is best-effort: do not fail the request.
    return null
  }

  return (data?.response_json as T | undefined) ?? null
}

export async function setCachedAiRecommendation(params: {
  inputHash: string
  inputNormalized: unknown
  responseJson: unknown
}) {
  const supabase = getCacheClient()
  const row = {
    input_hash: params.inputHash,
    input_normalized: params.inputNormalized,
    response_json: params.responseJson,
    created_at: new Date().toISOString(),
  }

  await supabase
    .from("cached_ai_recommendations")
    .upsert(row, { onConflict: "input_hash" })
}

export async function getCachedRawgGame<T>(slug: string): Promise<T | null> {
  const supabase = getCacheClient()
  const cutoff = new Date(Date.now() - RAWG_TTL_MS).toISOString()

  const { data, error } = await supabase
    .from("cached_games")
    .select("rawg_payload, updated_at")
    .eq("slug", slug)
    .gte("updated_at", cutoff)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null

  return (data?.rawg_payload as T | undefined) ?? null
}

export async function setCachedRawgGame(params: {
  slug: string
  title: string
  rawgPayload: unknown
}) {
  const supabase = getCacheClient()
  const row = {
    slug: params.slug,
    title: params.title,
    rawg_payload: params.rawgPayload,
    updated_at: new Date().toISOString(),
  }

  await supabase.from("cached_games").upsert(row, { onConflict: "slug" })
}

