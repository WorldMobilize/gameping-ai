/** True when STEAM_IMPORT_ENABLED is set to 1 or true. */
export function isSteamImportEnabled(): boolean {
  const raw = process.env.STEAM_IMPORT_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true";
}

/** When true, only profiles.plan = admin may use Steam import. */
export function isSteamImportAdminOnly(): boolean {
  const raw = process.env.STEAM_IMPORT_ADMIN_ONLY?.trim().toLowerCase();
  return raw === "1" || raw === "true";
}

export function canUseSteamImport(plan: string | null | undefined): boolean {
  if (!isSteamImportEnabled()) return false;
  if (isSteamImportAdminOnly()) return plan === "admin";
  return true;
}
