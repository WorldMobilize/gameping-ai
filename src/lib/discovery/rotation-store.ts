import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  HiddenGemPick,
  WeeklyGamePick,
} from "@/lib/discovery/curated-picks";

/**
 * Supabase-backed cache for the discovery rotations that power /hidden-gems and
 * /games-of-the-week. Pages read the latest *published* rotation from here
 * instead of hitting RAWG/ITAD on every visit; an admin/cron route generates and
 * publishes new rotations (see /api/admin/discovery/generate).
 *
 * Uses the EXISTING service-role Supabase credentials (SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY) — same pattern as src/app/api/cron/route.ts. No new
 * env vars, no client/anon access (the table is service-role only via RLS).
 *
 * Everything is best-effort: if credentials are missing or a query fails, reads
 * return null and the caller falls back to the static curated data.
 */

export type RotationType = "hidden_gems" | "games_of_the_week";
export type RotationStatus = "draft" | "published" | "failed";

/** Stored payload shapes — exactly what the existing views already consume. */
export type HiddenGemsRotationData = {
  featured: HiddenGemPick;
  picks: HiddenGemPick[];
};
export type WeeklyRotationData = {
  featured: WeeklyGamePick;
  picks: WeeklyGamePick[];
};

export type RotationSourceSummary = {
  source: string; // e.g. "rawg"
  generator: string; // e.g. "live-discovery"
  featuredCount: number;
  itemCount: number;
  note?: string;
};

type RotationItem = HiddenGemPick | WeeklyGamePick;

export type DiscoveryRotation<T extends RotationItem = RotationItem> = {
  type: RotationType;
  periodKey: string;
  status: RotationStatus;
  items: T[];
  featuredItem: T | null;
  sourceSummary: RotationSourceSummary | null;
  error: string | null;
  generatedAt: string | null;
  publishedAt: string | null;
};

/** Metadata surfaced to admins on the page (subtle line, admin-gated). */
export type RotationMeta = {
  periodKey: string;
  status: RotationStatus;
  generatedAt: string | null;
  publishedAt: string | null;
  sourceSummary: RotationSourceSummary | null;
  /** True when the published rotation isn't for the current period (fallback). */
  stale: boolean;
};

type RotationRow = {
  type: string;
  period_key: string;
  status: string;
  items: unknown;
  featured_item: unknown;
  source_summary: unknown;
  error: string | null;
  generated_at: string | null;
  published_at: string | null;
};

const ROTATIONS_TABLE = "discovery_rotations";

// ---------------------------------------------------------------------------
// Service-role client (mirrors getCronSupabase in api/cron/route.ts)
// ---------------------------------------------------------------------------

export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Period keys
// ---------------------------------------------------------------------------

/** Monthly key in UTC, e.g. "2026-06". */
export function monthlyPeriodKey(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** ISO-8601 week key in UTC, e.g. "2026-W26". */
export function isoWeekPeriodKey(now: Date = new Date()): string {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  // Thursday in current week decides the year (ISO 8601).
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week =
    1 +
    Math.round(
      (d.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Current period key for a rotation type. */
export function currentPeriodKey(type: RotationType, now: Date = new Date()): string {
  return type === "hidden_gems" ? monthlyPeriodKey(now) : isoWeekPeriodKey(now);
}

/**
 * Period key shifted by a number of weeks (for admin testing — e.g. simulate
 * "next week"). For weekly rotations this lands on the next ISO week; for
 * monthly hidden-gems it shifts the underlying date, which may cross a month
 * boundary. offsetWeeks=0 → current period.
 */
export function periodKeyForOffset(
  type: RotationType,
  offsetWeeks: number,
  now: Date = new Date()
): string {
  if (!offsetWeeks) return currentPeriodKey(type, now);
  const shifted = new Date(now.getTime() + offsetWeeks * 7 * 24 * 60 * 60 * 1000);
  return currentPeriodKey(type, shifted);
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asSourceSummary(value: unknown): RotationSourceSummary | null {
  if (!value || typeof value !== "object") return null;
  return value as RotationSourceSummary;
}

function mapRow(row: RotationRow): DiscoveryRotation {
  return {
    type: row.type as RotationType,
    periodKey: row.period_key,
    status: row.status as RotationStatus,
    items: asArray<RotationItem>(row.items),
    featuredItem: (row.featured_item as RotationItem | null) ?? null,
    sourceSummary: asSourceSummary(row.source_summary),
    error: row.error ?? null,
    generatedAt: row.generated_at,
    publishedAt: row.published_at,
  };
}

const ROW_COLUMNS =
  "type, period_key, status, items, featured_item, source_summary, error, generated_at, published_at";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Published rotation for a specific period (defaults to the current period). */
export async function getPublishedRotation(
  type: RotationType,
  periodKey: string = currentPeriodKey(type)
): Promise<DiscoveryRotation | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(ROTATIONS_TABLE)
      .select(ROW_COLUMNS)
      .eq("type", type)
      .eq("period_key", periodKey)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as RotationRow);
  } catch {
    return null;
  }
}

/**
 * Any rotation for a specific period regardless of status (draft/published/
 * failed). Used to decide whether generation should be skipped unless forced.
 */
export async function getAnyRotation(
  type: RotationType,
  periodKey: string
): Promise<DiscoveryRotation | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(ROTATIONS_TABLE)
      .select(ROW_COLUMNS)
      .eq("type", type)
      .eq("period_key", periodKey)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as RotationRow);
  } catch {
    return null;
  }
}

/** Most recently published rotation of a type, regardless of period. */
export async function getLatestRotation(
  type: RotationType
): Promise<DiscoveryRotation | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(ROTATIONS_TABLE)
      .select(ROW_COLUMNS)
      .eq("type", type)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as RotationRow);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Writes (service role)
// ---------------------------------------------------------------------------

/**
 * Upsert a rotation as a `draft` (regeneration resets it to draft until
 * published). Returns true on success. Throws only if Supabase is unreachable
 * via the caller's try/catch; here we surface the error to the route.
 */
export async function saveRotation(
  type: RotationType,
  periodKey: string,
  data: HiddenGemsRotationData | WeeklyRotationData,
  sourceSummary?: RotationSourceSummary
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, error: "supabase_unconfigured" };
  const { error } = await supabase.from(ROTATIONS_TABLE).upsert(
    {
      type,
      period_key: periodKey,
      status: "draft",
      items: data.picks,
      featured_item: data.featured,
      source_summary: sourceSummary ?? null,
      error: null,
      generated_at: new Date().toISOString(),
      published_at: null,
    },
    { onConflict: "type,period_key" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Record a failed generation attempt (so admins can see why). */
export async function saveFailedRotation(
  type: RotationType,
  periodKey: string,
  errorMessage: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, error: "supabase_unconfigured" };
  const { error } = await supabase.from(ROTATIONS_TABLE).upsert(
    {
      type,
      period_key: periodKey,
      status: "failed",
      error: errorMessage,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "type,period_key" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Flip a saved draft to `published`. */
export async function publishRotation(
  type: RotationType,
  periodKey: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, error: "supabase_unconfigured" };
  const { data, error } = await supabase
    .from(ROTATIONS_TABLE)
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("type", type)
    .eq("period_key", periodKey)
    .select("type")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "rotation_not_found" };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Page resolver — published(current) → latest published → static fallback
// ---------------------------------------------------------------------------

function rotationHasContent(r: DiscoveryRotation | null): r is DiscoveryRotation {
  return !!r && r.items.length > 0;
}

function toMeta(r: DiscoveryRotation, stale: boolean): RotationMeta {
  return {
    periodKey: r.periodKey,
    status: r.status,
    generatedAt: r.generatedAt,
    publishedAt: r.publishedAt,
    sourceSummary: r.sourceSummary,
    stale,
  };
}

/**
 * Resolve the rotation a page should render.
 *
 * Fallback order:
 *   1. published rotation for the current period
 *   2. latest published rotation of the same type
 *   3. null → caller renders the local static fallback data
 */
export async function resolveRotation<T extends RotationItem>(
  type: RotationType
): Promise<{ data: { featured: T; picks: T[] } | null; meta: RotationMeta | null }> {
  const period = currentPeriodKey(type);

  const current = await getPublishedRotation(type, period);
  if (rotationHasContent(current)) {
    const picks = current.items as T[];
    const featured = (current.featuredItem as T | null) ?? picks[0];
    return { data: { featured, picks }, meta: toMeta(current, false) };
  }

  const latest = await getLatestRotation(type);
  if (rotationHasContent(latest)) {
    const picks = latest.items as T[];
    const featured = (latest.featuredItem as T | null) ?? picks[0];
    return {
      data: { featured, picks },
      meta: toMeta(latest, latest.periodKey !== period),
    };
  }

  return { data: null, meta: null };
}
