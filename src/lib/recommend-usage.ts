import "server-only";

import {
  PROMPT_MAX_ADMIN,
  PROMPT_MAX_DEFAULT,
} from "@/lib/recommend-limits";
import { getRecommendDailyLimit } from "@/lib/plan-limits";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export { PROMPT_MAX_ADMIN, PROMPT_MAX_DEFAULT, getRecommendDailyLimit };

export function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return null;
}

export function hashIpForRecommend(ip: string): string {
  const salt =
    process.env.RECOMMEND_IP_HASH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "gameping-recommend-ip";
  return createHash("sha256").update(`${salt}:${ip}`, "utf8").digest("hex");
}

export function shouldBypassRecommendLimits(
  plan: string | null | undefined
): boolean {
  if (plan === "admin") return true;
  if (process.env.RECOMMEND_DEV_BYPASS === "1") return true;
  return false;
}

export function getPromptMaxChars(
  plan: string | null | undefined,
  bypassLimits: boolean
): number {
  if (bypassLimits || plan === "admin") return PROMPT_MAX_ADMIN;
  return PROMPT_MAX_DEFAULT;
}

function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function tryConsumeRecommendDailySlot(params: {
  req: Request;
  userId: string | null;
  dailyLimit: number;
}): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = getServiceClient();
  const ip = getClientIp(params.req);
  const pUserId = params.userId;
  const pIpHash = pUserId
    ? null
    : hashIpForRecommend(ip?.trim() || "unknown");

  if (!supabase) {
    console.warn(
      "[recommend] Daily limit skipped: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return { allowed: true, used: 0, limit: params.dailyLimit };
  }

  const { data, error } = await supabase.rpc("try_increment_recommend_daily_usage", {
    p_user_id: pUserId,
    p_ip_hash: pIpHash,
    p_daily_limit: params.dailyLimit,
  });

  if (error) {
    console.error("[recommend] try_increment_recommend_daily_usage failed", error);
    return { allowed: false, used: 0, limit: params.dailyLimit };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const allowed = Boolean(row?.allowed);
  const used = typeof row?.used_count === "number" ? row.used_count : 0;
  const limit =
    typeof row?.daily_limit === "number" ? row.daily_limit : params.dailyLimit;

  return { allowed, used, limit };
}
