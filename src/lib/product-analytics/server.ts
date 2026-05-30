import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { ProductAnalyticsEventName, ProductAnalyticsMetadata } from "./types";

function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for analytics");
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export type InsertProductEventParams = {
  event_name: ProductAnalyticsEventName;
  session_id: string;
  anonymous_id?: string | null;
  user_id?: string | null;
  page_path?: string | null;
  referrer?: string | null;
  user_agent?: string | null;
  device_type?: string | null;
  country?: string | null;
  metadata?: ProductAnalyticsMetadata;
};

/** Best-effort insert; never throws to callers. */
export async function insertProductEvent(
  params: InsertProductEventParams
): Promise<boolean> {
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("product_events").insert({
      event_name: params.event_name,
      session_id: params.session_id,
      anonymous_id: params.anonymous_id ?? null,
      user_id: params.user_id ?? null,
      page_path: params.page_path ?? null,
      referrer: params.referrer ?? null,
      user_agent: params.user_agent ?? null,
      device_type: params.device_type ?? null,
      country: params.country ?? null,
      metadata: params.metadata ?? {},
    });
    if (error) {
      console.error("[product-analytics] insert failed", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[product-analytics] insert error", err);
    return false;
  }
}

export function inferCountryFromHeaders(req: Request): string | null {
  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-country-code");
  if (!country) return null;
  const t = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(t)) return null;
  return t;
}
