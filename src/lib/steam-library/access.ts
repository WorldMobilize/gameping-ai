import "server-only";

export {
  canUseSteamImport,
  isSteamImportAdminOnly,
  isSteamImportEnabled,
} from "@/lib/steam-library/access-flags";

export function getSteamWebApiKey(): string | null {
  const key = process.env.STEAM_WEB_API_KEY?.trim();
  return key || null;
}
