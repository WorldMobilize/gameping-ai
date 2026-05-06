import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const { data: games } = await supabase
    .from("outbound_clicks")
    .select("game_title")
  
  const { data: stores } = await supabase
    .from("outbound_clicks")
    .select("store_name")

  const { data: sources } = await supabase
    .from("outbound_clicks")
    .select("source")

  return NextResponse.json({
    games,
    stores,
    sources,
  })
}