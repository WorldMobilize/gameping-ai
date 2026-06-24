import "server-only";

import { getServiceSupabase } from "@/lib/discovery/rotation-store";
import { isTasteDna, type TasteDna } from "@/lib/steam-library/taste-dna-types";

/**
 * buildUserTasteProfile(userId) — a cached, AI-readable summary of one user's
 * taste, assembled ONLY from signals we already store:
 *   - saved searches        (search_profiles.preferences / .games)
 *   - tracked games         (tracked_games.title)
 *   - Steam import           (user_steam_connections.taste_dna + user_steam_games)
 *
 * Hard rules:
 *   - No invented data. If a user has no signals, we return an INCOMPLETE
 *     profile (`complete: false`) and the caller renders the empty state.
 *   - Reads run with the service role (server-side generation), keyed by user id.
 *   - The result is upserted into user_taste_profiles so generation passes and
 *     future pages can read a stable, cheap summary.
 *
 * This module does NOT call OpenAI — it only aggregates DB signals. OpenAI is
 * applied later, by the generators, to explain/rank on top of this profile.
 */

export type FavoriteGameRef = {
  title: string;
  /** playtime minutes when the signal came from a Steam import (else absent). */
  playtimeMin?: number;
  source: "steam" | "saved" | "tracked";
};

export type UserTasteProfile = {
  userId: string;
  /** True when there is at least one real taste signal to personalize from. */
  complete: boolean;
  likes: string[];
  avoid: string[];
  favoriteGames: FavoriteGameRef[];
  /** Normalized titles the user OWNS on Steam — used to exclude from fresh picks. */
  ownedTitleNorms: string[];
  preferredGenres: string[];
  preferredMechanics: string[];
  steamSummary: {
    ownedCount: number;
    playedCount: number;
    totalPlaytimeMin: number;
    topPlayed: string[];
    archetype?: string;
    summary?: string;
  } | null;
  sourceSummary: {
    hasSteam: boolean;
    savedSearches: number;
    savedGames: number;
    trackedGames: number;
    steamGames: number;
    generatedAt: string;
  };
};

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const v of value) {
    if (typeof v === "string" && v.trim()) out.push(v.trim());
  }
  return out;
}

/** Normalize a title for owned-set matching (lowercase, alnum-only). */
function normTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Pull string-y signal arrays from a saved-search `preferences` jsonb blob. */
function extractPreferenceSignals(preferences: unknown): {
  genres: string[];
  mechanics: string[];
  likes: string[];
  avoid: string[];
} {
  const p = (preferences && typeof preferences === "object" ? preferences : {}) as Record<
    string,
    unknown
  >;
  return {
    genres: [...asStringArray(p.genres), ...asStringArray(p.selectedTags)],
    mechanics: asStringArray(p.mechanics),
    likes: [...asStringArray(p.vibes), ...asStringArray(p.playStyles)],
    avoid: asStringArray(p.avoid),
  };
}

/** Pull game titles from a saved-search `games` jsonb blob (array of objects). */
function extractSavedGameTitles(games: unknown): string[] {
  if (!Array.isArray(games)) return [];
  const out: string[] = [];
  for (const g of games) {
    if (g && typeof g === "object") {
      const title = (g as Record<string, unknown>).title ?? (g as Record<string, unknown>).name;
      if (typeof title === "string" && title.trim()) out.push(title.trim());
    } else if (typeof g === "string" && g.trim()) {
      out.push(g.trim());
    }
  }
  return out;
}

function dedupeStrings(values: string[], limit = 24): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= limit) break;
  }
  return out;
}

function tasteDnaSignals(dna: TasteDna): {
  likes: string[];
  avoid: string[];
  mechanics: string[];
  archetype?: string;
  summary?: string;
} {
  if (dna.version === 2) {
    return {
      likes: [...asStringArray(dna.likes), ...asStringArray(dna.favoriteSignals)],
      avoid: asStringArray(dna.avoidLikely),
      mechanics: asStringArray(dna.recommendationHints),
      archetype: dna.playerArchetype,
      summary: dna.summary,
    };
  }
  return {
    likes: [...asStringArray(dna.likes), ...asStringArray(dna.favoriteSignals)],
    avoid: [],
    mechanics: [],
  };
}

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------

export async function buildUserTasteProfile(userId: string): Promise<UserTasteProfile> {
  const generatedAt = new Date().toISOString();
  const empty: UserTasteProfile = {
    userId,
    complete: false,
    likes: [],
    avoid: [],
    favoriteGames: [],
    ownedTitleNorms: [],
    preferredGenres: [],
    preferredMechanics: [],
    steamSummary: null,
    sourceSummary: {
      hasSteam: false,
      savedSearches: 0,
      savedGames: 0,
      trackedGames: 0,
      steamGames: 0,
      generatedAt,
    },
  };

  const supabase = getServiceSupabase();
  if (!supabase) return empty;

  // ---- gather signals (best-effort; any failure → that source contributes 0)
  const [searchRes, trackedRes, steamConnRes, steamGamesRes] = await Promise.all([
    supabase
      .from("search_profiles")
      .select("preferences, games, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("tracked_games").select("title, is_active").eq("user_id", userId).limit(200),
    supabase
      .from("user_steam_connections")
      .select("taste_dna, game_count, total_playtime_min")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_steam_games")
      .select("title, playtime_forever")
      .eq("user_id", userId)
      .order("playtime_forever", { ascending: false })
      .limit(30),
  ]);

  const searches = Array.isArray(searchRes.data) ? searchRes.data : [];
  const tracked = Array.isArray(trackedRes.data) ? trackedRes.data : [];
  const steamGames = Array.isArray(steamGamesRes.data) ? steamGamesRes.data : [];
  const steamConn = steamConnRes.data ?? null;

  const genres: string[] = [];
  const mechanics: string[] = [];
  const likes: string[] = [];
  const avoid: string[] = [];
  const favoriteGames: FavoriteGameRef[] = [];
  let savedGamesCount = 0;

  // saved searches → preference signals + saved game titles
  for (const row of searches) {
    const pref = extractPreferenceSignals((row as Record<string, unknown>).preferences);
    genres.push(...pref.genres);
    mechanics.push(...pref.mechanics);
    likes.push(...pref.likes);
    avoid.push(...pref.avoid);

    const savedTitles = extractSavedGameTitles((row as Record<string, unknown>).games);
    savedGamesCount += savedTitles.length;
    for (const title of savedTitles) {
      favoriteGames.push({ title, source: "saved" });
    }
  }

  // tracked games → favorite signals
  for (const row of tracked) {
    const title = (row as Record<string, unknown>).title;
    if (typeof title === "string" && title.trim()) {
      favoriteGames.push({ title: title.trim(), source: "tracked" });
    }
  }

  // Steam import → owned/played games + (optional) AI taste DNA.
  //
  // IMPORTANT: ingest the real owned/played library DIRECTLY from user_steam_games
  // and the connection row — do NOT gate this on taste_dna validating. The
  // AI-enriched taste_dna can be missing or fail validation, but an imported
  // library is itself a strong, real signal. (Gating Steam ingestion on taste_dna
  // is exactly what made premium pages miss an existing Steam import until the
  // user visited /settings/account, which re-imported and rebuilt taste_dna.)
  let steamSummary: UserTasteProfile["steamSummary"] = null;
  const steamConnected = Boolean(steamConn);
  const ownedTitleNorms: string[] = [];

  for (const g of steamGames) {
    const title = (g as Record<string, unknown>).title;
    const playtime = (g as Record<string, unknown>).playtime_forever;
    if (typeof title === "string" && title.trim()) {
      favoriteGames.push({
        title: title.trim(),
        playtimeMin: typeof playtime === "number" ? playtime : undefined,
        source: "steam",
      });
      ownedTitleNorms.push(normTitle(title));
    }
  }

  if (steamConnected) {
    const dnaRaw = (steamConn as Record<string, unknown>).taste_dna;
    const sig = isTasteDna(dnaRaw) ? tasteDnaSignals(dnaRaw) : null;
    if (sig) {
      likes.push(...sig.likes);
      avoid.push(...sig.avoid);
      mechanics.push(...sig.mechanics);
    }
    const stats = isTasteDna(dnaRaw) ? dnaRaw.stats : null;
    const connGameCount = Number((steamConn as Record<string, unknown>).game_count);
    const connPlaytime = Number((steamConn as Record<string, unknown>).total_playtime_min);
    const playedCount = steamGames.filter((g) => {
      const p = (g as Record<string, unknown>).playtime_forever;
      return typeof p === "number" && p > 0;
    }).length;
    const topPlayed = steamGames
      .map((g) => (g as Record<string, unknown>).title)
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .slice(0, 12);
    steamSummary = {
      ownedCount: stats?.ownedCount ?? (Number.isFinite(connGameCount) ? connGameCount : steamGames.length),
      playedCount: stats?.playedCount ?? playedCount,
      totalPlaytimeMin: stats?.totalPlaytimeMin ?? (Number.isFinite(connPlaytime) ? connPlaytime : 0),
      topPlayed,
      archetype: sig?.archetype,
      summary: sig?.summary,
    };
  }

  // de-dupe favorite games by title, keeping the strongest signal (steam > tracked > saved)
  const sourceRank: Record<FavoriteGameRef["source"], number> = { steam: 3, tracked: 2, saved: 1 };
  const byTitle = new Map<string, FavoriteGameRef>();
  for (const ref of favoriteGames) {
    const key = ref.title.toLowerCase();
    const existing = byTitle.get(key);
    if (!existing || sourceRank[ref.source] > sourceRank[existing.source]) {
      byTitle.set(key, ref);
    }
  }
  const mergedFavorites = [...byTitle.values()]
    .sort((a, b) => (b.playtimeMin ?? 0) - (a.playtimeMin ?? 0))
    .slice(0, 24);

  const profile: UserTasteProfile = {
    userId,
    complete: false,
    likes: dedupeStrings(likes),
    avoid: dedupeStrings(avoid),
    favoriteGames: mergedFavorites,
    ownedTitleNorms: [...new Set(ownedTitleNorms)],
    preferredGenres: dedupeStrings(genres, 16),
    preferredMechanics: dedupeStrings(mechanics, 16),
    steamSummary,
    sourceSummary: {
      hasSteam: steamConnected,
      savedSearches: searches.length,
      savedGames: savedGamesCount,
      trackedGames: tracked.length,
      steamGames: steamGames.length,
      generatedAt,
    },
  };

  profile.complete =
    profile.favoriteGames.length > 0 ||
    profile.preferredGenres.length > 0 ||
    profile.likes.length > 0 ||
    steamConnected ||
    Boolean(profile.steamSummary);

  // Debug-safe server log (no titles/PII — only counts + flags) so a missing
  // Steam signal is diagnosable without visiting /settings/account.
  console.info("[premium:taste-profile]", {
    userId,
    steamConnected,
    importedGameCount: steamGames.length,
    ownedTitleSetSize: profile.ownedTitleNorms.length,
    savedSearchCount: searches.length,
    trackedGameCount: tracked.length,
    complete: profile.complete,
  });

  // best-effort persist (never throws into the caller)
  await persistTasteProfile(profile);

  return profile;
}

async function persistTasteProfile(profile: UserTasteProfile): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;
  try {
    await supabase.from("user_taste_profiles").upsert(
      {
        user_id: profile.userId,
        taste_summary: {
          complete: profile.complete,
          likes: profile.likes,
          avoid: profile.avoid,
          archetype: profile.steamSummary?.archetype ?? null,
          summary: profile.steamSummary?.summary ?? null,
        },
        favorite_patterns: profile.likes,
        disliked_patterns: profile.avoid,
        favorite_games: profile.favoriteGames,
        preferred_genres: profile.preferredGenres,
        preferred_mechanics: profile.preferredMechanics,
        steam_summary: profile.steamSummary,
        source_summary: profile.sourceSummary,
        generated_at: profile.sourceSummary.generatedAt,
      },
      { onConflict: "user_id" }
    );
  } catch (err) {
    console.warn("[premium:taste-profile] persist failed", {
      userId: profile.userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Read a cached taste profile row (used by pages/admin views; never throws). */
export async function getCachedTasteProfileRow(userId: string): Promise<Record<string, unknown> | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("user_taste_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return (data as Record<string, unknown> | null) ?? null;
  } catch {
    return null;
  }
}
