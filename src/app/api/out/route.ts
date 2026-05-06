import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAffiliateUrl } from "@/lib/affiliate"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const dealID = searchParams.get("dealID")
  const gameID = searchParams.get("gameID")
  const gameTitle = searchParams.get("gameTitle")
  const storeID = searchParams.get("storeID")
  const storeName = searchParams.get("storeName")
  const source = searchParams.get("source") || "unknown"

  const redirectUrl = getAffiliateUrl({
    storeID,
    dealID,
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