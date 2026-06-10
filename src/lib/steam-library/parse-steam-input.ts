export type ParsedSteamInput = {
  steamId: string | null;
  vanityUrl: string | null;
  profileUrl: string | null;
};

const STEAM_ID64_RE = /^\d{17}$/;
const STEAM_PROFILES_ID_RE =
  /(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/profiles\/(\d{17})(?:\/|$|\?)/i;
const STEAM_VANITY_RE =
  /(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/id\/([^/?#]+)/i;

function normalizeInput(raw: string): string {
  return raw.trim();
}

/** Parse SteamID64, vanity username, or steamcommunity profile URL. */
export function parseSteamProfileInput(raw: string): ParsedSteamInput {
  const input = normalizeInput(raw);
  if (!input) {
    return { steamId: null, vanityUrl: null, profileUrl: null };
  }

  if (STEAM_ID64_RE.test(input)) {
    return {
      steamId: input,
      vanityUrl: null,
      profileUrl: `https://steamcommunity.com/profiles/${input}`,
    };
  }

  const profilesMatch = input.match(STEAM_PROFILES_ID_RE);
  if (profilesMatch?.[1]) {
    const steamId = profilesMatch[1];
    return {
      steamId,
      vanityUrl: null,
      profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
    };
  }

  const vanityMatch = input.match(STEAM_VANITY_RE);
  if (vanityMatch?.[1]) {
    const vanity = decodeURIComponent(vanityMatch[1]).trim();
    if (!vanity) {
      return { steamId: null, vanityUrl: null, profileUrl: null };
    }
    return {
      steamId: null,
      vanityUrl: vanity,
      profileUrl: `https://steamcommunity.com/id/${vanity}`,
    };
  }

  if (/^[\w-]{2,32}$/i.test(input)) {
    return {
      steamId: null,
      vanityUrl: input,
      profileUrl: `https://steamcommunity.com/id/${input}`,
    };
  }

  return { steamId: null, vanityUrl: null, profileUrl: null };
}
