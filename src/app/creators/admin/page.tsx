import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import { createClient } from "@/lib/supabase/server";
import { billingPeriod } from "@/lib/creator-commissions";
import { getCreatorEarningsReport } from "@/lib/creator-referrals";
import { buildNoIndexMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildNoIndexMetadata("Creator earnings (admin) | GamePing AI");
export const dynamic = "force-dynamic";

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

const TH = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400";
const TD = "px-4 py-3 text-sm text-slate-800 dark:text-slate-200";

export default async function CreatorAdminPage() {
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

  const period = billingPeriod(Math.floor(Date.now() / 1000));
  const { summary, referrals } = await getCreatorEarningsReport(period);

  const totalThisMonth = summary.reduce((s, r) => s + r.thisMonthCents, 0);
  const totalAllTime = summary.reduce((s, r) => s + r.allTimeCents, 0);

  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
          Admin
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Creator earnings
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Period {period}. Owed this month:{" "}
          <span className="font-bold text-slate-900 dark:text-white">{usd(totalThisMonth)}</span> ·
          all-time commission {usd(totalAllTime)}.
        </p>

        {/* Per-creator summary */}
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            By creator
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <table className="w-full min-w-[640px] border-collapse">
              <thead className="border-b border-slate-200/80 bg-slate-50 dark:border-slate-800/80 dark:bg-white/[0.03]">
                <tr>
                  <th className={TH}>Creator</th>
                  <th className={TH}>Code</th>
                  <th className={TH}>Active refs</th>
                  <th className={TH}>Total refs</th>
                  <th className={TH}>This month</th>
                  <th className={TH}>All-time</th>
                </tr>
              </thead>
              <tbody>
                {summary.length === 0 ? (
                  <tr>
                    <td className={`${TD} text-slate-500`} colSpan={6}>
                      No creators yet.
                    </td>
                  </tr>
                ) : (
                  summary.map((r) => (
                    <tr key={r.creatorUserId} className="border-b border-slate-100 dark:border-slate-800/60">
                      <td className={`${TD} font-medium`}>{r.creatorEmail}</td>
                      <td className={`${TD} font-mono`}>{r.code ?? "—"}</td>
                      <td className={TD}>{r.activeReferrals}</td>
                      <td className={TD}>{r.totalReferrals}</td>
                      <td className={`${TD} font-semibold`}>{usd(r.thisMonthCents)}</td>
                      <td className={TD}>{usd(r.allTimeCents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Who brought whom */}
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Referrals
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="border-b border-slate-200/80 bg-slate-50 dark:border-slate-800/80 dark:bg-white/[0.03]">
                <tr>
                  <th className={TH}>Creator</th>
                  <th className={TH}>Brought (member)</th>
                  <th className={TH}>Code</th>
                  <th className={TH}>Type</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Since</th>
                </tr>
              </thead>
              <tbody>
                {referrals.length === 0 ? (
                  <tr>
                    <td className={`${TD} text-slate-500`} colSpan={6}>
                      No referrals yet.
                    </td>
                  </tr>
                ) : (
                  referrals.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                      <td className={`${TD} font-medium`}>{r.creatorEmail}</td>
                      <td className={TD}>{r.referredEmail}</td>
                      <td className={`${TD} font-mono`}>{r.code}</td>
                      <td className={TD}>{r.codeType}</td>
                      <td className={TD}>{r.status}</td>
                      <td className={TD}>{fmtDate(r.startedAt)}</td>
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
