import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Read-only admin analytics: reads the pre-built aggregate views (v_analytics_*)
 * with the service role. It never touches how events are collected — the
 * analytics pipeline is off-limits; this only surfaces what already exists.
 * The aggregate views are anonymous (counts, not people), so no PII is shown.
 */

function serviceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export type DailyKpi = {
  date: string;
  visitors_sessions: number;
  page_views: number;
  recommend_completed: number;
  game_views: number;
  store_clicks: number;
  signups: number;
};

export type TopPage = {
  page_path: string;
  page_views: number;
  unique_sessions: number;
};

export type SiteAnalytics = {
  daily: DailyKpi[];
  topPages: TopPage[];
  totals: {
    visitors: number;
    pageViews: number;
    signups: number;
    storeClicks: number;
    recommends: number;
  };
};

const N = (v: unknown): number => (typeof v === "number" ? v : 0);

export async function getSiteAnalytics(): Promise<SiteAnalytics> {
  const supabase = serviceClient();

  const [kpiRes, pagesRes] = await Promise.all([
    supabase
      .from("v_analytics_daily_kpi")
      .select(
        "date, visitors_sessions, page_views, recommend_completed, game_views, store_clicks, signups"
      )
      .order("date", { ascending: false })
      .limit(30),
    supabase
      .from("v_analytics_top_pages")
      .select("page_path, page_views, unique_sessions")
      .order("page_views", { ascending: false })
      .limit(12),
  ]);

  const daily = (kpiRes.data ?? []) as DailyKpi[];
  const topPages = (pagesRes.data ?? []) as TopPage[];

  const totals = daily.reduce(
    (t, d) => ({
      visitors: t.visitors + N(d.visitors_sessions),
      pageViews: t.pageViews + N(d.page_views),
      signups: t.signups + N(d.signups),
      storeClicks: t.storeClicks + N(d.store_clicks),
      recommends: t.recommends + N(d.recommend_completed),
    }),
    { visitors: 0, pageViews: 0, signups: 0, storeClicks: 0, recommends: 0 }
  );

  return { daily, topPages, totals };
}
