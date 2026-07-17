import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import { createClient } from "@/lib/supabase/server";
import { getSiteAnalytics } from "@/lib/admin-analytics";
import { buildNoIndexMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildNoIndexMetadata("Site analytics (admin) | GamePing AI");
export const dynamic = "force-dynamic";

const TH = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400";
const TD = "px-4 py-3 text-sm text-slate-800 dark:text-slate-200";

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
      <p className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.plan !== "admin") notFound();

  const { daily, topPages, totals } = await getSiteAnalytics();

  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
          Admin
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Site analytics
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Last {daily.length} days. Aggregate, anonymous counts.
        </p>

        {/* Totals */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Tile label="Visitors (sessions)" value={totals.visitors} />
          <Tile label="Page views" value={totals.pageViews} />
          <Tile label="Recommends done" value={totals.recommends} />
          <Tile label="Store clicks" value={totals.storeClicks} />
          <Tile label="Signups" value={totals.signups} />
        </div>

        {/* Daily table */}
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            By day
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="border-b border-slate-200/80 bg-slate-50 dark:border-slate-800/80 dark:bg-white/[0.03]">
                <tr>
                  <th className={TH}>Date</th>
                  <th className={TH}>Visitors</th>
                  <th className={TH}>Page views</th>
                  <th className={TH}>Recommends</th>
                  <th className={TH}>Game views</th>
                  <th className={TH}>Store clicks</th>
                  <th className={TH}>Signups</th>
                </tr>
              </thead>
              <tbody>
                {daily.length === 0 ? (
                  <tr>
                    <td className={`${TD} text-slate-500`} colSpan={7}>
                      No analytics yet.
                    </td>
                  </tr>
                ) : (
                  daily.map((d) => (
                    <tr key={d.date} className="border-b border-slate-100 dark:border-slate-800/60">
                      <td className={`${TD} font-medium`}>{String(d.date).slice(0, 10)}</td>
                      <td className={TD}>{(d.visitors_sessions ?? 0).toLocaleString()}</td>
                      <td className={TD}>{(d.page_views ?? 0).toLocaleString()}</td>
                      <td className={TD}>{(d.recommend_completed ?? 0).toLocaleString()}</td>
                      <td className={TD}>{(d.game_views ?? 0).toLocaleString()}</td>
                      <td className={TD}>{(d.store_clicks ?? 0).toLocaleString()}</td>
                      <td className={TD}>{(d.signups ?? 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top pages */}
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Top pages
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <table className="w-full min-w-[520px] border-collapse">
              <thead className="border-b border-slate-200/80 bg-slate-50 dark:border-slate-800/80 dark:bg-white/[0.03]">
                <tr>
                  <th className={TH}>Page</th>
                  <th className={TH}>Views</th>
                  <th className={TH}>Unique sessions</th>
                </tr>
              </thead>
              <tbody>
                {topPages.length === 0 ? (
                  <tr>
                    <td className={`${TD} text-slate-500`} colSpan={3}>
                      No page views yet.
                    </td>
                  </tr>
                ) : (
                  topPages.map((p) => (
                    <tr key={p.page_path} className="border-b border-slate-100 dark:border-slate-800/60">
                      <td className={`${TD} font-mono`}>{p.page_path}</td>
                      <td className={TD}>{(p.page_views ?? 0).toLocaleString()}</td>
                      <td className={TD}>{(p.unique_sessions ?? 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </AppSection>
    </AppPageShell>
  );
}
