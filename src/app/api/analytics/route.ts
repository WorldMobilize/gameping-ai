import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (profile.plan !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: games, error: gamesError } = await supabase
    .from("outbound_clicks")
    .select("game_title")

  const { data: stores, error: storesError } = await supabase
    .from("outbound_clicks")
    .select("store_name")

  const { data: sources, error: sourcesError } = await supabase
    .from("outbound_clicks")
    .select("source")

  if (gamesError || storesError || sourcesError) {
    return NextResponse.json(
      { error: "Analytics query failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    games,
    stores,
    sources,
  })
}