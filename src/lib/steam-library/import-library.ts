import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { parseSteamProfileInput } from "@/lib/steam-library/parse-steam-input";
import {
  fetchSteamOwnedGames,
  resolveSteamIdFromInput,
  SteamApiError,
} from "@/lib/steam-library/steam-api";
import { buildTasteDna } from "@/lib/steam-library/build-taste-dna";
import { normalizeSteamGameTitle } from "@/lib/steam-library/title-norm";

export const STEAM_LIBRARY_PRIVATE_MESSAGE =
  "Steam library is private or unavailable. Make sure your Steam profile and game details are public.";

export type SteamImportTopGame = {
  steamAppId: number;
  title: string;
  playtimeForever: number;
  playtime2weeks: number | null;
};

export type SteamImportResult = {
  steamId: string;
  profileUrl: string | null;
  vanityUrl: string | null;
  gameCount: number;
  totalPlaytimeMin: number;
  topGames: SteamImportTopGame[];
  importedAt: string;
};

const GAME_INSERT_BATCH = 200;

export async function importSteamLibraryForUser(params: {
  supabase: SupabaseClient;
  userId: string;
  profileInput: string;
}): Promise<SteamImportResult> {
  const parsed = parseSteamProfileInput(params.profileInput);
  if (!parsed.steamId && !parsed.vanityUrl) {
    throw new SteamApiError("Enter a valid Steam profile URL or Steam ID", "resolve_failed");
  }

  let steamId: string;
  try {
    steamId = await resolveSteamIdFromInput({
      steamId: parsed.steamId,
      vanityUrl: parsed.vanityUrl,
    });
  } catch (err) {
    if (err instanceof SteamApiError && err.code === "profile_private") {
      throw new SteamApiError(STEAM_LIBRARY_PRIVATE_MESSAGE, "library_unavailable");
    }
    throw err;
  }

  let games;
  try {
    games = await fetchSteamOwnedGames(steamId);
  } catch (err) {
    if (
      err instanceof SteamApiError &&
      (err.code === "library_unavailable" || err.code === "profile_private")
    ) {
      throw new SteamApiError(STEAM_LIBRARY_PRIVATE_MESSAGE, "library_unavailable");
    }
    throw err;
  }

  const now = new Date().toISOString();
  const totalPlaytimeMin = games.reduce((sum, g) => sum + g.playtime_forever, 0);
  const tasteDna = buildTasteDna(
    games.map((game) => ({
      title: game.name,
      playtimeForever: game.playtime_forever,
    })),
    now
  );
  const profileUrl =
    parsed.profileUrl ?? `https://steamcommunity.com/profiles/${steamId}`;

  const { error: deleteGamesError } = await params.supabase
    .from("user_steam_games")
    .delete()
    .eq("user_id", params.userId);
  if (deleteGamesError) {
    throw new Error(deleteGamesError.message);
  }

  const { error: upsertError } = await params.supabase
    .from("user_steam_connections")
    .upsert(
      {
        user_id: params.userId,
        steam_id: steamId,
        vanity_url: parsed.vanityUrl,
        profile_url: profileUrl,
        visibility_status: "ok",
        game_count: games.length,
        total_playtime_min: totalPlaytimeMin,
        imported_at: now,
        updated_at: now,
        taste_dna: tasteDna,
        taste_version: 1,
        rawg_enriched_at: null,
      },
      { onConflict: "user_id" }
    );
  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const rows = games.map((game) => ({
    user_id: params.userId,
    steam_app_id: game.appid,
    title: game.name,
    title_norm: normalizeSteamGameTitle(game.name),
    playtime_forever: game.playtime_forever,
    playtime_2weeks: game.playtime_2weeks,
    rawg_id: null,
    imported_at: now,
  }));

  for (let i = 0; i < rows.length; i += GAME_INSERT_BATCH) {
    const batch = rows.slice(i, i + GAME_INSERT_BATCH);
    const { error: insertError } = await params.supabase
      .from("user_steam_games")
      .insert(batch);
    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const topGames = [...games]
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 10)
    .map((game) => ({
      steamAppId: game.appid,
      title: game.name,
      playtimeForever: game.playtime_forever,
      playtime2weeks: game.playtime_2weeks,
    }));

  return {
    steamId,
    profileUrl,
    vanityUrl: parsed.vanityUrl,
    gameCount: games.length,
    totalPlaytimeMin,
    topGames,
    importedAt: now,
  };
}

export async function deleteSteamLibraryForUser(params: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<void> {
  const { error: gamesError } = await params.supabase
    .from("user_steam_games")
    .delete()
    .eq("user_id", params.userId);
  if (gamesError) throw new Error(gamesError.message);

  const { error: connError } = await params.supabase
    .from("user_steam_connections")
    .delete()
    .eq("user_id", params.userId);
  if (connError) throw new Error(connError.message);
}

export async function getSteamLibrarySummary(params: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<SteamImportResult | null> {
  const { data: connection, error: connError } = await params.supabase
    .from("user_steam_connections")
    .select(
      "steam_id, vanity_url, profile_url, game_count, total_playtime_min, imported_at"
    )
    .eq("user_id", params.userId)
    .maybeSingle();

  if (connError) throw new Error(connError.message);
  if (!connection) return null;

  const { data: topRows, error: topError } = await params.supabase
    .from("user_steam_games")
    .select("steam_app_id, title, playtime_forever, playtime_2weeks")
    .eq("user_id", params.userId)
    .order("playtime_forever", { ascending: false })
    .limit(10);

  if (topError) throw new Error(topError.message);

  return {
    steamId: connection.steam_id,
    profileUrl: connection.profile_url,
    vanityUrl: connection.vanity_url,
    gameCount: connection.game_count ?? 0,
    totalPlaytimeMin: connection.total_playtime_min ?? 0,
    importedAt: connection.imported_at,
    topGames: (topRows ?? []).map((row) => ({
      steamAppId: row.steam_app_id,
      title: row.title,
      playtimeForever: row.playtime_forever ?? 0,
      playtime2weeks: row.playtime_2weeks ?? null,
    })),
  };
}
