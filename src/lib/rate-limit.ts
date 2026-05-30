import "server-only"

import { createClient } from "@supabase/supabase-js"

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: string
}

function getServiceClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for rate limit")
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() || null
  const xrip = req.headers.get("x-real-ip")
  if (xrip) return xrip.trim()
  return null
}

/**
 * Lightweight rate limiting stored in Supabase.
 * Writes ONLY technical metadata (key + timestamps), no user content.
 */
export async function rateLimit(params: {
  req: Request
  action: "recommend" | "email" | "feedback" | "analytics"
  limit: number
  windowMs: number
  userId?: string | null
}): Promise<RateLimitResult> {
  const supabase = getServiceClient()

  const ip = getClientIp(params.req)
  const identity = params.userId ? `user:${params.userId}` : `ip:${ip ?? "unknown"}`
  const key = `${params.action}:${identity}`

  const now = Date.now()
  const windowStart = new Date(now - params.windowMs).toISOString()
  const resetAt = new Date(now + params.windowMs).toISOString()

  const { count } = await supabase
    .from("rate_limit_events")
    .select("*", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", windowStart)

  const used = count ?? 0
  const remaining = Math.max(0, params.limit - used)

  if (used >= params.limit) {
    return {
      allowed: false,
      limit: params.limit,
      remaining: 0,
      resetAt,
    }
  }

  // Best-effort insert. If it fails, we still allow (avoid breaking requests).
  await supabase.from("rate_limit_events").insert({
    key,
    created_at: new Date().toISOString(),
  })

  return {
    allowed: true,
    limit: params.limit,
    remaining: Math.max(0, remaining - 1),
    resetAt,
  }
}

