import { DIRECTORY_GAMES } from "@/lib/curated/home-picks";

const STEAM_APP_ID_FROM_CDN_IMAGE = /steam\/apps\/(\d+)\//;

export type TrustedSteamAppIdSource =
  | "cheapshark_game"
  | "rawg_store"
  | "curated_map"
  | "hint";

export type ResolvedTrustedSteamAppId = {
  appId: number;
  source: TrustedSteamAppIdSource;
};

function normalizeTitleKey(title: string): string {
  return title.trim().toLowerCase();
}

/** Extra trusted ids for titles not in DIRECTORY_GAMES (no fuzzy Steam search). */
const PRICING_STEAM_APP_ID_SUPPLEMENTS: Record<string, number> = {
  "borderlands 3": 397540,
  paladins: 444090,
  "fishing planet": 380600,
};

const curatedSteamAppIdByTitle = (() => {
  const map = new Map<string, number>();
  for (const pick of DIRECTORY_GAMES) {
    const match = pick.image.match(STEAM_APP_ID_FROM_CDN_IMAGE);
    if (!match) continue;
    const appId = Number(match[1]);
    if (!Number.isFinite(appId) || appId <= 0) continue;
    map.set(normalizeTitleKey(pick.title), appId);
  }
  for (const [title, appId] of Object.entries(PRICING_STEAM_APP_ID_SUPPLEMENTS)) {
    if (!map.has(title)) map.set(title, appId);
  }
  return map;
})();

export function parseSteamAppId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const appId = Number(trimmed);
  return Number.isFinite(appId) && appId > 0 ? appId : null;
}

export function lookupCuratedSteamAppId(title: string): number | null {
  const key = normalizeTitleKey(title);
  if (!key) return null;
  return curatedSteamAppIdByTitle.get(key) ?? null;
}

type RawgStoreEntry = {
  store?: { slug?: string; name?: string };
  url?: string;
};

const STEAM_STORE_URL_APP_ID =
  /(?:store\.)?steampowered\.com\/app\/(\d+)(?:\/|$|\?)/i;

/** Extract Steam app id from RAWG `stores` entries (Steam slug or steampowered URL only). */
export function extractSteamAppIdFromRawgStores(stores: unknown): number | null {
  if (!Array.isArray(stores)) return null;

  for (const entry of stores) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as RawgStoreEntry;
    const slug = row.store?.slug?.trim().toLowerCase() ?? "";
    const url = typeof row.url === "string" ? row.url.trim() : "";
    if (slug !== "steam" && !STEAM_STORE_URL_APP_ID.test(url)) continue;

    const fromUrl = url.match(STEAM_STORE_URL_APP_ID);
    if (fromUrl?.[1]) {
      const appId = parseSteamAppId(fromUrl[1]);
      if (appId) return appId;
    }
  }

  return null;
}

export function resolveTrustedSteamAppId(params: {
  title: string;
  cheapsharkSteamAppId?: string | null;
  rawgStores?: unknown;
  steamAppIdHint?: number | string | null;
}): ResolvedTrustedSteamAppId | null {
  const fromHint = parseSteamAppId(params.steamAppIdHint);
  if (fromHint) {
    return { appId: fromHint, source: "hint" };
  }

  const fromCheapShark = parseSteamAppId(params.cheapsharkSteamAppId);
  if (fromCheapShark) {
    return { appId: fromCheapShark, source: "cheapshark_game" };
  }

  const fromRawg = extractSteamAppIdFromRawgStores(params.rawgStores);
  if (fromRawg) {
    return { appId: fromRawg, source: "rawg_store" };
  }

  const fromCurated = lookupCuratedSteamAppId(params.title);
  if (fromCurated) {
    return { appId: fromCurated, source: "curated_map" };
  }

  return null;
}
