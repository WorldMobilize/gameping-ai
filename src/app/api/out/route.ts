import { NextRequest, NextResponse } from "next/server"
import { getAffiliateUrl } from "@/lib/affiliate"
import {
  parseAllowedOutboundRedirectUrl,
  readOutboundRedirectTargetParam,
} from "@/lib/outbound-redirect"
import {
  inferDeviceType,
  sanitizeSessionId,
} from "@/lib/product-analytics/sanitize"
import {
  inferCountryFromHeaders,
  insertProductEvent,
} from "@/lib/product-analytics/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const dealID = searchParams.get("dealID")
  const gameID = searchParams.get("gameID")
  const gameTitle = searchParams.get("gameTitle")
  const storeID = searchParams.get("storeID")
  const storeName = searchParams.get("storeName")
  const source = searchParams.get("source") || "unknown"

  const rawTo = readOutboundRedirectTargetParam(searchParams)
  const safeRawUrl = parseAllowedOutboundRedirectUrl(rawTo)

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

    const sessionFromQuery = sanitizeSessionId(searchParams.get("sid"))
    const userAgent = req.headers.get("user-agent")
    await insertProductEvent({
      event_name: "store_clicked",
      session_id: sessionFromQuery ?? "server_outbound",
      user_id: user?.id ?? null,
      page_path: null,
      user_agent: userAgent?.slice(0, 512) ?? null,
      device_type: inferDeviceType(userAgent),
      country: inferCountryFromHeaders(req),
      metadata: {
        title: (gameTitle ?? "").slice(0, 120),
        store: (storeName ?? storeID ?? "unknown").slice(0, 80),
        provider: source.slice(0, 80),
      },
    })
  } catch (error) {
    console.error("Outbound tracking failed:", error)
  }

  return NextResponse.redirect(redirectUrl)
}
