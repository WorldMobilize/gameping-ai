import "server-only";

import { getSteamWebApiKey } from "@/lib/steam-library/access";

const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_FETCH_TIMEOUT_MS = 20_000;

export type SteamOwnedGame = {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks: number | null;
};

export class SteamApiError extends Error {
  constructor(
    message: string,
    readonly code:
      | "missing_api_key"
      | "resolve_failed"
      | "profile_private"
      | "library_unavailable"
      | "upstream"
  ) {
    super(message);
    this.name = "SteamApiError";
  }
}

async function steamFetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STEAM_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new SteamApiError(`Steam API HTTP ${res.status}`, "upstream");
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof SteamApiError) throw err;
    throw new SteamApiError("Steam API request failed", "upstream");
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveSteamVanityUrl(
  vanityUrl: string,
  apiKey: string
): Promise<string> {
  const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${encodeURIComponent(
    apiKey
  )}&vanityurl=${encodeURIComponent(vanityUrl)}`;
  const json = await steamFetchJson<{
    response?: { success?: number; steamid?: string };
  }>(url);

  const success = json.response?.success;
  const steamId = json.response?.steamid?.trim();
  if (success === 1 && steamId) return steamId;
  throw new SteamApiError("Could not resolve Steam vanity URL", "resolve_failed");
}

/** communityvisibilitystate: 1 private, 2 friends, 3 public */
async function assertSteamProfilePublic(
  steamId: string,
  apiKey: string
): Promise<void> {
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(
    apiKey
  )}&steamids=${encodeURIComponent(steamId)}`;
  const json = await steamFetchJson<{
    response?: {
      players?: Array<{ communityvisibilitystate?: number }>;
    };
  }>(url);

  const visibility = json.response?.players?.[0]?.communityvisibilitystate;
  if (visibility !== 3) {
    throw new SteamApiError("Steam profile is not public", "profile_private");
  }
}

export async function fetchSteamOwnedGames(
  steamId: string,
  apiKey?: string
): Promise<SteamOwnedGame[]> {
  const key = apiKey ?? getSteamWebApiKey();
  if (!key) {
    throw new SteamApiError("Steam Web API key is not configured", "missing_api_key");
  }

  await assertSteamProfilePublic(steamId, key);

  const url =
    `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/` +
    `?key=${encodeURIComponent(key)}` +
    `&steamid=${encodeURIComponent(steamId)}` +
    `&include_appinfo=1` +
    `&include_played_free_games=1`;

  const json = await steamFetchJson<{
    response?: {
      game_count?: number;
      games?: Array<{
        appid?: number;
        name?: string;
        playtime_forever?: number;
        playtime_2weeks?: number;
      }>;
    };
  }>(url);

  const games = json.response?.games ?? [];
  if (games.length === 0) {
    throw new SteamApiError(
      "Steam library is private or unavailable",
      "library_unavailable"
    );
  }

  const out: SteamOwnedGame[] = [];
  for (const game of games) {
    const appid = game.appid;
    const name = typeof game.name === "string" ? game.name.trim() : "";
    if (!Number.isFinite(appid) || !name) continue;
    out.push({
      appid: Number(appid),
      name,
      playtime_forever: Math.max(0, Math.floor(game.playtime_forever ?? 0)),
      playtime_2weeks:
        typeof game.playtime_2weeks === "number" && Number.isFinite(game.playtime_2weeks)
          ? Math.max(0, Math.floor(game.playtime_2weeks))
          : null,
    });
  }

  if (out.length === 0) {
    throw new SteamApiError(
      "Steam library is private or unavailable",
      "library_unavailable"
    );
  }

  return out;
}

export async function resolveSteamIdFromInput(params: {
  steamId: string | null;
  vanityUrl: string | null;
  apiKey?: string;
}): Promise<string> {
  const key = params.apiKey ?? getSteamWebApiKey();
  if (!key) {
    throw new SteamApiError("Steam Web API key is not configured", "missing_api_key");
  }
  if (params.steamId) return params.steamId;
  if (params.vanityUrl) return resolveSteamVanityUrl(params.vanityUrl, key);
  throw new SteamApiError("Could not resolve Steam profile", "resolve_failed");
}
