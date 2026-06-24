import "server-only";

import {
  getServiceSupabase,
  isoWeekPeriodKey,
  monthlyPeriodKey,
} from "@/lib/discovery/rotation-store";
import type {
  DealCardData,
  WeeklyPickCardData,
} from "@/lib/discovery/premium-demo-data";

/**
 * Per-user cache for the personalized premium pages
 *   /weekly-picks · /deals-for-you · /monthly-recap
 *
 * Same shape and best-effort philosophy as discovery-rotations' rotation-store,
 * but keyed by (user_id, type, period_key). Generation (admin/cron) writes a
 * draft and then publishes; pages read the latest published rotation for the
 * current period, falling back to the latest published of any period, then to
 * the empty/preview state.
 *
 * Uses the EXISTING service-role Supabase credentials (getServiceSupabase). The
 * table is service-role-write + own-row-read (RLS); pages read on the server via
 * the service role keyed by the resolved user id.
 */

export type PremiumRotationType = "weekly_picks" | "deals_for_you" | "monthly_recap";
export type PremiumRotationStatus = "draft" | "published" | "failed";

export const PREMIUM_ROTATION_TYPES: PremiumRotationType[] = [
  "weekly_picks",
  "deals_for_you",
  "monthly_recap",
];

export function isPremiumRotationType(value: unknown): value is PremiumRotationType {
  return typeof value === "string" && PREMIUM_ROTATION_TYPES.includes(value as PremiumRotationType);
}

/** AI-written framing for a rotation (headline + short paragraph). */
export type PremiumAiSummary = {
  headline: string;
  summary: string;
};

export type PremiumSourceSummary = {
  generator: string;
  sources: string[];
  itemCount: number;
  aiUsed: boolean;
  note?: string;
};

/** Monthly-recap "core" payload stored in featured_item. */
export type MonthlyRecapCore = {
  personality: { name: string; summary: string; dna: { label: string; value: number }[] };
  month: { searches: number; discovered: number; saved: number; alerts: number };
  evolution: { before: string[]; now: string[] };
};

/** Generic stored payload (the generator fills the right shapes per type). */
export type PremiumRotationData = {
  items: WeeklyPickCardData[] | DealCardData[];
  featuredItem: WeeklyPickCardData | DealCardData | MonthlyRecapCore | null;
  aiSummary: PremiumAiSummary | null;
  sourceSummary: PremiumSourceSummary;
};

export type UserPremiumRotation = {
  userId: string;
  type: PremiumRotationType;
  periodKey: string;
  status: PremiumRotationStatus;
  items: unknown[];
  featuredItem: unknown | null;
  aiSummary: PremiumAiSummary | null;
  sourceSummary: PremiumSourceSummary | null;
  error: string | null;
  generatedAt: string | null;
  publishedAt: string | null;
};

export type PremiumRotationMeta = {
  periodKey: string;
  status: PremiumRotationStatus;
  generatedAt: string | null;
  publishedAt: string | null;
  sourceSummary: PremiumSourceSummary | null;
  /** True when the published rotation isn't for the current period (fallback). */
  stale: boolean;
};

type Row = {
  user_id: string;
  type: string;
  period_key: string;
  status: string;
  items: unknown;
  featured_item: unknown;
  ai_summary: unknown;
  source_summary: unknown;
  error: string | null;
  generated_at: string | null;
  published_at: string | null;
};

const TABLE = "user_premium_rotations";
const COLUMNS =
  "user_id, type, period_key, status, items, featured_item, ai_summary, source_summary, error, generated_at, published_at";

// ---------------------------------------------------------------------------
// Period keys (weekly features use ISO week; recap uses month)
// ---------------------------------------------------------------------------

export function currentPremiumPeriodKey(
  type: PremiumRotationType,
  now: Date = new Date()
): string {
  return type === "monthly_recap" ? monthlyPeriodKey(now) : isoWeekPeriodKey(now);
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asObject<T>(value: unknown): T | null {
  return value && typeof value === "object" ? (value as T) : null;
}

function mapRow(row: Row): UserPremiumRotation {
  return {
    userId: row.user_id,
    type: row.type as PremiumRotationType,
    periodKey: row.period_key,
    status: row.status as PremiumRotationStatus,
    items: asArray(row.items),
    featuredItem: row.featured_item ?? null,
    aiSummary: asObject<PremiumAiSummary>(row.ai_summary),
    sourceSummary: asObject<PremiumSourceSummary>(row.source_summary),
    error: row.error ?? null,
    generatedAt: row.generated_at,
    publishedAt: row.published_at,
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getPublishedUserRotation(
  userId: string,
  type: PremiumRotationType,
  periodKey: string = currentPremiumPeriodKey(type)
): Promise<UserPremiumRotation | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLUMNS)
      .eq("user_id", userId)
      .eq("type", type)
      .eq("period_key", periodKey)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as Row);
  } catch {
    return null;
  }
}

export async function getLatestUserRotation(
  userId: string,
  type: PremiumRotationType
): Promise<UserPremiumRotation | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLUMNS)
      .eq("user_id", userId)
      .eq("type", type)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as Row);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Writes (service role)
// ---------------------------------------------------------------------------

export async function saveUserRotation(
  userId: string,
  type: PremiumRotationType,
  periodKey: string,
  data: PremiumRotationData
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, error: "supabase_unconfigured" };
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      type,
      period_key: periodKey,
      status: "draft",
      items: data.items,
      featured_item: data.featuredItem,
      ai_summary: data.aiSummary,
      source_summary: data.sourceSummary,
      error: null,
      generated_at: new Date().toISOString(),
      published_at: null,
    },
    { onConflict: "user_id,type,period_key" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveFailedUserRotation(
  userId: string,
  type: PremiumRotationType,
  periodKey: string,
  errorMessage: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, error: "supabase_unconfigured" };
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      type,
      period_key: periodKey,
      status: "failed",
      error: errorMessage,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,type,period_key" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function publishUserRotation(
  userId: string,
  type: PremiumRotationType,
  periodKey: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, error: "supabase_unconfigured" };
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("type", type)
    .eq("period_key", periodKey)
    .select("type")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "rotation_not_found" };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Page resolver — published(current) → latest published → null (empty state)
// ---------------------------------------------------------------------------

function hasContent(r: UserPremiumRotation | null): r is UserPremiumRotation {
  if (!r) return false;
  // monthly_recap can be content-bearing via featured_item even if items is small
  return r.items.length > 0 || Boolean(r.featuredItem);
}

function toMeta(r: UserPremiumRotation, stale: boolean): PremiumRotationMeta {
  return {
    periodKey: r.periodKey,
    status: r.status,
    generatedAt: r.generatedAt,
    publishedAt: r.publishedAt,
    sourceSummary: r.sourceSummary,
    stale,
  };
}

export async function resolveUserRotation(
  userId: string,
  type: PremiumRotationType
): Promise<{ rotation: UserPremiumRotation | null; meta: PremiumRotationMeta | null }> {
  const period = currentPremiumPeriodKey(type);

  const current = await getPublishedUserRotation(userId, type, period);
  if (hasContent(current)) {
    return { rotation: current, meta: toMeta(current, false) };
  }

  const latest = await getLatestUserRotation(userId, type);
  if (hasContent(latest)) {
    return { rotation: latest, meta: toMeta(latest, latest.periodKey !== period) };
  }

  return { rotation: null, meta: null };
}
