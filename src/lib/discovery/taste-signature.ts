import "server-only";

import { getServiceSupabase } from "@/lib/discovery/rotation-store";

/**
 * Fingerprint of every signal that feeds `buildUserTasteProfile`: the Steam
 * import, saved searches, and tracked games.
 *
 * The premium rotations (weekly picks / deals / recap) are cached per ISO period,
 * so without this a user could import their whole Steam library and keep seeing
 * picks generated before it. We store the signature alongside the rotation and
 * regenerate when it no longer matches.
 *
 * Returns null when the fingerprint cannot be read. Callers MUST treat null as
 * "cannot verify → leave the cache alone": failing open here would re-generate on
 * every visit, and every regeneration is an OpenAI call.
 */
export async function computeTasteSignature(userId: string): Promise<string | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  try {
    const [searchRes, trackedRes, steamRes] = await Promise.all([
      supabase
        .from("search_profiles")
        .select("id, is_active")
        .eq("user_id", userId)
        .limit(200),
      supabase
        .from("tracked_games")
        .select("id, is_active")
        .eq("user_id", userId)
        .limit(200),
      supabase
        .from("user_steam_connections")
        .select("game_count, total_playtime_min")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (searchRes.error || trackedRes.error) return null;

    // Ids, not counts: swapping one tracked game for another must change the
    // signature, and a count would not.
    const active = (rows: { id: unknown; is_active: unknown }[] | null) =>
      (rows ?? [])
        .filter((r) => r.is_active !== false)
        .map((r) => String(r.id))
        .sort()
        .join(",");

    const searches = active(searchRes.data);
    const tracked = active(trackedRes.data);

    // Playtime moves on every re-import, so it catches a refreshed library even
    // when the game count is unchanged.
    const steam = steamRes.data
      ? `${steamRes.data.game_count ?? 0}:${steamRes.data.total_playtime_min ?? 0}`
      : "none";

    return hash(`steam=${steam}|searches=${searches}|tracked=${tracked}`);
  } catch {
    return null;
  }
}

/** djb2 — short, stable, and enough to detect change (not a security hash). */
function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}
