import { supabase } from "@/lib/supabase";

/**
 * WorldMobilize claims persistence (Demo MVP).
 *
 * Prefers the Supabase table `worldmobilize_claims` (see sql/worldmobilize_claims.sql).
 * If that table isn't present yet — or any request fails — it transparently
 * falls back to localStorage so the demo is always playable. Callers can read
 * `getPersistenceMode()` to surface a "local demo" notice.
 *
 * NOTE: localStorage is NOT production persistence — claims live only in the
 * current browser until the SQL migration is applied.
 */

const TABLE = "worldmobilize_claims";
const LOCAL_KEY = "gameping:worldmobilize:claims:v1";

export type Claim = {
  territory_id: string;
  territory_name: string;
  user_id: string;
  owner_label: string;
  community_name: string;
  youtube_url: string | null;
  twitch_url: string | null;
  discord_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ClaimInput = {
  territory_id: string;
  territory_name: string;
  community_name: string;
  youtube_url: string | null;
  twitch_url: string | null;
  discord_url: string | null;
};

export type SaveResult =
  | { ok: true; claim: Claim }
  | { ok: false; error: "not_authenticated" | "already_claimed" | "unknown" };

type Mode = "unknown" | "supabase" | "local";
let mode: Mode = "unknown";

export function getPersistenceMode(): Mode {
  return mode;
}

/* ── localStorage fallback ──────────────────────────────────── */

function readLocal(): Record<string, Claim> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Claim>) : {};
  } catch {
    return {};
  }
}

function writeLocal(map: Record<string, Claim>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode — ignore */
  }
}

/* ── current user ───────────────────────────────────────────── */

export type CurrentUser = { id: string; label: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (typeof meta.display_name === "string" && meta.display_name.trim()) ||
    user.email ||
    "Player";
  return { id: user.id, label: String(name) };
}

/* ── read ───────────────────────────────────────────────────── */

export async function fetchClaims(): Promise<Claim[]> {
  try {
    const { data, error } = await supabase.from(TABLE).select("*");
    if (error) throw error;
    mode = "supabase";
    return (data ?? []) as Claim[];
  } catch {
    mode = "local";
    return Object.values(readLocal());
  }
}

/* ── write ──────────────────────────────────────────────────── */

export async function saveClaim(
  input: ClaimInput,
  intent: "create" | "edit"
): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const now = new Date().toISOString();
  const row: Claim = {
    ...input,
    user_id: user.id,
    owner_label: user.label,
    updated_at: now,
    ...(intent === "create" ? { created_at: now } : {}),
  };

  // Try Supabase unless we've already confirmed the table is absent.
  if (mode !== "local") {
    try {
      if (intent === "create") {
        const { data, error } = await supabase
          .from(TABLE)
          .insert({
            territory_id: row.territory_id,
            territory_name: row.territory_name,
            user_id: row.user_id,
            owner_label: row.owner_label,
            community_name: row.community_name,
            youtube_url: row.youtube_url,
            twitch_url: row.twitch_url,
            discord_url: row.discord_url,
          })
          .select("*")
          .single();
        if (error) {
          // 23505 = unique violation (territory already claimed).
          if ((error as { code?: string }).code === "23505") {
            return { ok: false, error: "already_claimed" };
          }
          throw error;
        }
        mode = "supabase";
        return { ok: true, claim: data as Claim };
      } else {
        const { data, error } = await supabase
          .from(TABLE)
          .update({
            community_name: row.community_name,
            youtube_url: row.youtube_url,
            twitch_url: row.twitch_url,
            discord_url: row.discord_url,
          })
          .eq("territory_id", row.territory_id)
          .eq("user_id", row.user_id)
          .select("*")
          .single();
        if (error) throw error;
        mode = "supabase";
        return { ok: true, claim: data as Claim };
      }
    } catch {
      // Table missing or request failed → fall through to local.
      mode = "local";
    }
  }

  // localStorage fallback
  const map = readLocal();
  if (intent === "create" && map[row.territory_id]) {
    return { ok: false, error: "already_claimed" };
  }
  map[row.territory_id] = { ...map[row.territory_id], ...row };
  writeLocal(map);
  return { ok: true, claim: map[row.territory_id] };
}
