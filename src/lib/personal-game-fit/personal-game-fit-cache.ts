import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  PERSONAL_GAME_FIT_PROMPT_VERSION,
  type PersonalGameFit,
} from "@/lib/personal-game-fit/types";
import { parsePersonalGameFit } from "@/lib/personal-game-fit/parse-personal-game-fit";

const FIT_CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function getCacheClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for personal fit cache");
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getCachedPersonalGameFit(params: {
  userId: string;
  rawgId: number;
  tasteDnaHash: string;
}): Promise<PersonalGameFit | null> {
  try {
    const supabase = getCacheClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("personal_game_fits")
      .select("fit_json, expires_at")
      .eq("user_id", params.userId)
      .eq("rawg_id", params.rawgId)
      .eq("taste_dna_hash", params.tasteDnaHash)
      .eq("fit_prompt_version", PERSONAL_GAME_FIT_PROMPT_VERSION)
      .gt("expires_at", now)
      .maybeSingle();

    if (error || !data?.fit_json) return null;
    return parsePersonalGameFit(data.fit_json);
  } catch {
    return null;
  }
}

export async function setCachedPersonalGameFit(params: {
  userId: string;
  rawgId: number;
  gameTitle: string;
  tasteDnaVersion: number;
  tasteDnaHash: string;
  fit: PersonalGameFit;
}): Promise<void> {
  try {
    const supabase = getCacheClient();
    const expiresAt = new Date(Date.now() + FIT_CACHE_TTL_MS).toISOString();

    await supabase.from("personal_game_fits").upsert(
      {
        user_id: params.userId,
        rawg_id: params.rawgId,
        game_title: params.gameTitle,
        taste_dna_version: params.tasteDnaVersion,
        taste_dna_hash: params.tasteDnaHash,
        fit_prompt_version: PERSONAL_GAME_FIT_PROMPT_VERSION,
        fit_json: params.fit,
        expires_at: expiresAt,
      },
      {
        onConflict: "user_id,rawg_id,taste_dna_hash,fit_prompt_version",
      }
    );
  } catch (err) {
    console.error("[personal-game-fit] cache write failed", err);
  }
}
