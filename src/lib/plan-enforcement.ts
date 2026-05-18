import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_QUOTAS } from "@/lib/plan-quotas";

export type PlanResourceTable = "search_profiles" | "tracked_games";

export function isPremiumPlan(plan: string | null | undefined): boolean {
  return plan === "premium" || plan === "admin";
}

export function getFreeActiveCap(resource: PlanResourceTable): number {
  return resource === "search_profiles"
    ? PLAN_QUOTAS.freeSavedSearches
    : PLAN_QUOTAS.freeTrackedGames;
}

export async function countUserResourceRows(
  supabase: SupabaseClient,
  userId: string,
  table: PlanResourceTable,
  opts?: { activeOnly?: boolean }
): Promise<number> {
  let q = supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (opts?.activeOnly) {
    q = q.eq("is_active", true);
  }

  const { count, error } = await q;
  if (error) {
    console.error(`[plan-enforcement] count ${table}`, error);
    throw error;
  }
  return count ?? 0;
}

/**
 * Ex-Premium downgraded Free users: total items exceed Free cap → legacy inactive storage.
 * Normal Free users (never exceeded cap): strict total limits, no paused overflow.
 */
export async function usesLegacyInactiveStorage(
  supabase: SupabaseClient,
  userId: string,
  plan: string | null | undefined,
  resource: PlanResourceTable
): Promise<boolean> {
  if (isPremiumPlan(plan)) return false;
  const total = await countUserResourceRows(supabase, userId, resource);
  return total > getFreeActiveCap(resource);
}

/**
 * On Premium → Free downgrade: keep newest items active (by created_at), pause the rest.
 */
export async function enforceFreePlanActiveCaps(
  supabase: SupabaseClient,
  userId: string
): Promise<{ savedPaused: number; trackedPaused: number }> {
  const savedPaused = await capActiveRowsForUser(
    supabase,
    userId,
    "search_profiles",
    PLAN_QUOTAS.freeSavedSearches
  );
  const trackedPaused = await capActiveRowsForUser(
    supabase,
    userId,
    "tracked_games",
    PLAN_QUOTAS.freeTrackedGames
  );
  return { savedPaused, trackedPaused };
}

async function capActiveRowsForUser(
  supabase: SupabaseClient,
  userId: string,
  table: PlanResourceTable,
  cap: number
): Promise<number> {
  const { data: rows, error: selErr } = await supabase
    .from(table)
    .select("id, is_active, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (selErr) {
    console.error(`[plan-enforcement] cap select ${table}`, selErr);
    throw selErr;
  }

  const list = rows ?? [];
  if (list.length <= cap) {
    return 0;
  }

  const keepIds = list.slice(0, cap).map((r) => r.id as string);
  const pauseIds = list.slice(cap).map((r) => r.id as string);

  if (keepIds.length > 0) {
    const { error: onErr } = await supabase
      .from(table)
      .update({ is_active: true })
      .eq("user_id", userId)
      .in("id", keepIds);
    if (onErr) {
      console.error(`[plan-enforcement] cap activate ${table}`, onErr);
      throw onErr;
    }
  }

  if (pauseIds.length === 0) return 0;

  const { error: offErr } = await supabase
    .from(table)
    .update({ is_active: false })
    .eq("user_id", userId)
    .in("id", pauseIds);

  if (offErr) {
    console.error(`[plan-enforcement] cap pause ${table}`, offErr);
    throw offErr;
  }

  return pauseIds.filter((id) => {
    const row = list.find((r) => r.id === id);
    return row?.is_active !== false;
  }).length;
}

export async function canActivateResourceRow(params: {
  supabase: SupabaseClient;
  userId: string;
  plan: string | null | undefined;
  resource: PlanResourceTable;
}): Promise<{ ok: true } | { ok: false; reason: "active_limit" | "total_limit" }> {
  const cap = getFreeActiveCap(params.resource);
  if (isPremiumPlan(params.plan)) {
    return { ok: true };
  }

  const legacy = await usesLegacyInactiveStorage(
    params.supabase,
    params.userId,
    params.plan,
    params.resource
  );

  if (legacy) {
    const active = await countUserResourceRows(params.supabase, params.userId, params.resource, {
      activeOnly: true,
    });
    if (active >= cap) return { ok: false, reason: "active_limit" };
    return { ok: true };
  }

  const total = await countUserResourceRows(params.supabase, params.userId, params.resource);
  if (total >= cap) return { ok: false, reason: "total_limit" };
  return { ok: true };
}

export async function canCreateResourceRow(params: {
  supabase: SupabaseClient;
  userId: string;
  plan: string | null | undefined;
  resource: PlanResourceTable;
}): Promise<{ ok: true } | { ok: false; reason: "active_limit" | "total_limit" }> {
  const cap = getFreeActiveCap(params.resource);
  if (isPremiumPlan(params.plan)) {
    const total = await countUserResourceRows(params.supabase, params.userId, params.resource);
    const premiumCap =
      params.resource === "search_profiles"
        ? PLAN_QUOTAS.premiumSavedSearches
        : PLAN_QUOTAS.premiumTrackedGames;
    if (total >= premiumCap) return { ok: false, reason: "total_limit" };
    return { ok: true };
  }

  const legacy = await usesLegacyInactiveStorage(
    params.supabase,
    params.userId,
    params.plan,
    params.resource
  );

  if (legacy) {
    const active = await countUserResourceRows(params.supabase, params.userId, params.resource, {
      activeOnly: true,
    });
    if (active >= cap) return { ok: false, reason: "active_limit" };
    return { ok: true };
  }

  const total = await countUserResourceRows(params.supabase, params.userId, params.resource);
  if (total >= cap) return { ok: false, reason: "total_limit" };
  return { ok: true };
}
