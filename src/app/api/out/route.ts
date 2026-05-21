import { NextRequest, NextResponse } from "next/server"
import { getAffiliateUrl } from "@/lib/affiliate"
import {
  parseAllowedOutboundRedirectUrl,
  readOutboundRedirectTargetParam,
} from "@/lib/outbound-redirect"
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
  } catch (error) {
    console.error("Outbound tracking failed:", error)
  }

  return NextResponse.redirect(redirectUrl)
}
