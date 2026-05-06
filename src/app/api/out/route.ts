import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAffiliateUrl } from "@/lib/affiliate"

const ALLOWED_HOSTNAMES = new Set([
  "cheapshark.com",
  "www.cheapshark.com",
  "store.steampowered.com",
  "www.greenmangaming.com",
  "www.fanatical.com",
  "www.humblebundle.com",
])

function parseAllowedRedirectUrl(rawUrl: string | null) {
  if (!rawUrl) return null

  try {
    const url = new URL(rawUrl)
    const protocol = url.protocol.toLowerCase()
    const hostname = url.hostname.toLowerCase()

    if (protocol !== "https:" && protocol !== "http:") return null
    if (!ALLOWED_HOSTNAMES.has(hostname)) return null

    return url.toString()
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const dealID = searchParams.get("dealID")
  const gameID = searchParams.get("gameID")
  const gameTitle = searchParams.get("gameTitle")
  const storeID = searchParams.get("storeID")
  const storeName = searchParams.get("storeName")
  const source = searchParams.get("source") || "unknown"

  // User-provided redirect URL (do not trust; validate server-side)
  const rawTo = searchParams.get("to") ?? searchParams.get("rawUrl")
  const safeRawUrl = parseAllowedRedirectUrl(rawTo)

  if (!dealID && !safeRawUrl) {
    return NextResponse.json(
      { error: "Missing dealID or valid redirect url" },
      { status: 400 }
    )
  }

  const redirectUrl = getAffiliateUrl({
    storeID,
    dealID,
    rawUrl: safeRawUrl,
  })

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from("outbound_clicks").insert({
      user_id: user?.id ?? null,
      deal_id: dealID,
      game_id: gameID,
      game_title: gameTitle,
      store_id: storeID,
      store_name: storeName,
      source,
      destination_url: redirectUrl,
    })

    if (error) {
      console.error("Supabase insert error:", error)
    }
  } catch (error) {
    console.error("Outbound tracking failed:", error)
  }

  return NextResponse.redirect(redirectUrl)
}