import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isTasteDna, type TasteDna } from "@/lib/steam-library/build-taste-dna";

export async function getTasteDnaForUser(params: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<TasteDna | null> {
  const { data, error } = await params.supabase
    .from("user_steam_connections")
    .select("taste_dna")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.taste_dna || !isTasteDna(data.taste_dna)) return null;
  return data.taste_dna;
}
