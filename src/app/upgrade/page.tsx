"use client";

import Link from "next/link";
import { Fragment, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import ManageBillingButton from "@/components/ManageBillingButton";
import UpgradePageAtmosphere from "@/components/upgrade/UpgradePageAtmosphere";
import { UPGRADE_PAGE_MAX_WIDTH } from "@/components/upgrade/upgrade-plan-styles";
import { PLAN_QUOTAS } from "@/lib/plan-quotas";
import { EARLY_ACCESS_NOTICE } from "@/lib/product-copy";
import { CREATOR_BASE_COMMISSION_PCT } from "@/lib/creator-program";
import {
  discountedPremiumPrice,
  FREE_FEATURES,
  FREE_PRICE,
  PREMIUM_FEATURES,
  PREMIUM_YEARLY_SAVINGS_PCT,
  premiumPeriod,
  premiumPrice,
} from "@/lib/pricing";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

/**
 * Pricing — Release Candidate redesign (presentation only).
 *
 * Calm-premium: gold "upgrade tier" identity, two clean plan cards, a billing
 * toggle, a feature comparison table, and an accordion FAQ. ALL billing logic
 * is preserved untouched — plan loading, the Stripe checkout call, the
 * billing-interval state, and the paid-tier gating are exactly as before.
 * Prices come from the existing placeholder constants.
 */

type LoadedPlan = "free" | "premium" | "admin" | null;

/* ── Premium tokens — the blue treatment used by the landing pricing cards ── */
const GOLD_TEXT = "text-blue-700 dark:text-blue-400";
const HEADING = "text-slate-900 dark:text-white";
const BODY = "text-slate-600 dark:text-slate-300";
const CARD = "border-slate-200/60 bg-white dark:border-white/[0.07] dark:bg-white/[0.02]";

const GOLD_CTA =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_-16px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-white dark:text-slate-900 dark:shadow-[0_18px_44px_-16px_rgba(0,0,0,0.6)] dark:hover:bg-slate-100 dark:focus-visible:ring-white/40";
const GHOST_CTA =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-transparent px-5 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-white/20 dark:text-white/85 dark:hover:border-white/35 dark:hover:bg-white/[0.04] dark:focus-visible:ring-white/40";

function Check({ className = GOLD_TEXT }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

/* ── Feature comparison, grouped by product (quota values from PLAN_QUOTAS) ── */
type Row = { label: string; free: ReactNode; premium: ReactNode };
const COMPARISON_GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "AI Companion",
    rows: [
      { label: "Desktop overlay", free: true, premium: true },
      { label: "Text chat", free: true, premium: true },
      { label: "Daily requests", free: "Limited", premium: "Unlimited" },
      { label: "Voice chat", free: false, premium: true },
      { label: "Companion memory", free: false, premium: true },
      { label: "Resume previous sessions", free: false, premium: true },
    ],
  },
  {
    title: "GamePing",
    rows: [
      { label: "Recommendations per day", free: `${PLAN_QUOTAS.freeRecommendDaily}`, premium: `${PLAN_QUOTAS.premiumRecommendDaily}` },
      { label: "Saved runs", free: `${PLAN_QUOTAS.freeSavedSearches}`, premium: `${PLAN_QUOTAS.premiumSavedSearches}` },
      { label: "Tracked games", free: `${PLAN_QUOTAS.freeTrackedGames}`, premium: `${PLAN_QUOTAS.premiumTrackedGames}` },
      { label: "Price-drop alerts", free: true, premium: true },
      { label: "Taste DNA", free: false, premium: true },
      { label: "Steam Import", free: false, premium: true },
      { label: "Monthly gaming recap", free: false, premium: true },
      { label: "Early access to new features", free: false, premium: true },
    ],
  },
];

function Cell({ value }: { value: ReactNode }) {
  if (typeof value === "boolean") {
    return (
      <span className="flex items-center justify-center">
        {value ? (
          <Check />
        ) : (
          <span className="leading-none text-slate-300 dark:text-slate-600" aria-label="Not included">—</span>
        )}
      </span>
    );
  }
  return <span className={`block text-center text-sm font-semibold ${HEADING}`}>{value}</span>;
}

function ComparisonTable() {
  return (
    <div className={`mt-6 overflow-hidden rounded-2xl border ${CARD}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="border-b border-slate-200/70 dark:border-white/[0.07]">
              <th className={`px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] ${BODY}`}>Feature</th>
              <th className={`px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] ${BODY}`}>Free</th>
              <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em]">
                <span className={GOLD_TEXT}>Premium</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_GROUPS.map((group) => (
              <Fragment key={group.title}>
                <tr className="border-t border-slate-200/70 bg-slate-50 dark:border-white/[0.07] dark:bg-white/[0.03]">
                  <td colSpan={3} className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] ${GOLD_TEXT}`}>{group.title}</td>
                </tr>
                {group.rows.map((row, i) => (
                  <tr key={row.label} className={i % 2 ? "bg-slate-50/50 dark:bg-white/[0.015]" : ""}>
                    <td className={`px-5 py-3.5 text-sm ${BODY}`}>{row.label}</td>
                    <td className="px-4 py-3.5 text-center"><Cell value={row.free} /></td>
                    <td className="px-4 py-3.5 text-center"><Cell value={row.premium} /></td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── FAQ (native accordion) ─────────────────────────────────── */
const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "What is a saved run?",
    a: "A saved run stores a recommendation — your prompt and filters — so you can revisit it from your dashboard. Price-drop alerts come from tracking individual games on their game pages.",
  },
  {
    q: "How do price alerts work?",
    a: "When a tracked game's verified price drops significantly, GamePing notifies you so you never miss a deal on something you want.",
  },
  {
    q: "How does billing work?",
    a: "Premium is billed monthly or yearly through Stripe. After checkout, your plan updates automatically. To cancel or change billing, open Manage billing (Premium subscribers) to reach the Stripe customer portal.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You keep Premium until the end of your billing period, then return to Free — your saved data stays on your account.",
  },
];

function FaqList() {
  return (
    <div className="mt-6 flex flex-col gap-3">
      {FAQ.map((item) => (
        <details key={item.q} className={`group rounded-2xl border px-5 py-4 ${CARD}`}>
          <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold ${HEADING}`}>
            {item.q}
            <svg className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <p className={`mt-3 text-sm leading-6 ${BODY}`}>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ── Plan cards ─────────────────────────────────────────────── */

function UpgradeContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [planLoading, setPlanLoading] = useState(true);
  const [profilePlan, setProfilePlan] = useState<LoadedPlan>(null);
  const [referralCode, setReferralCode] = useState("");
  const [codeInfo, setCodeInfo] = useState<{ valid: boolean; type?: string } | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);

  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      setPlanLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        if (!cancelled) {
          setProfilePlan(null);
          setPlanLoading(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const raw = profile?.plan;
      if (raw === "premium" || raw === "admin") {
        setProfilePlan(raw);
      } else {
        setProfilePlan("free");
      }
      setPlanLoading(false);
    }

    loadPlan();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadPlan();
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const validateCode = useCallback(async (raw: string) => {
    const code = raw.trim();
    if (!code) {
      setCodeInfo(null);
      return;
    }
    setCheckingCode(true);
    try {
      const res = await fetch(
        `/api/creator/redeem?code=${encodeURIComponent(code)}`,
        { credentials: "include" }
      );
      const d = (await res.json().catch(() => ({}))) as {
        valid?: boolean;
        type?: string;
      };
      setCodeInfo(res.ok ? { valid: Boolean(d.valid), type: d.type } : { valid: false });
    } catch {
      setCodeInfo({ valid: false });
    } finally {
      setCheckingCode(false);
    }
  }, []);

  // Pre-fill + validate a code arriving via a shared link (?ref=CODE).
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref.toUpperCase());
      void validateCode(ref);
    }
  }, [searchParams, validateCode]);

  async function startCheckout() {
    if (profilePlan === "premium" || profilePlan === "admin") {
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        showToast({
          variant: "info",
          message: "Log in first to upgrade to Premium.",
        });
        window.location.href = "/login";
        return;
      }

      // Creator referral: pass the entered code through. Ignored by the server
      // unless the program is enabled and the code is valid + not self-referral.
      const trimmedCode = referralCode.trim();

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interval: billingInterval,
          ...(trimmedCode ? { code: trimmedCode } : {}),
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          typeof body.message === "string"
            ? body.message
            : typeof body.error === "string"
              ? body.error
              : "Checkout could not start. Try again.";
        showToast({
          variant: res.status === 409 ? "info" : "error",
          message: msg,
        });
        return;
      }

      const url = typeof body.url === "string" ? body.url : null;
      if (!url) {
        showToast({ variant: "error", message: "No checkout URL returned." });
        return;
      }

      window.location.href = url;
    } catch {
      showToast({ variant: "error", message: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  }

  const hasPaidTier = profilePlan === "premium" || profilePlan === "admin";

  if (planLoading) {
    return (
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-3xl border border-slate-200/70 bg-white/50 motion-reduce:animate-none dark:border-white/[0.06] dark:bg-white/[0.02]" />
        <div className="h-96 animate-pulse rounded-3xl border border-slate-200/70 bg-white/50 motion-reduce:animate-none dark:border-white/[0.06] dark:bg-white/[0.02]" />
      </div>
    );
  }

  if (hasPaidTier) {
    return (
      <>
        {canceled ? <CanceledBanner /> : null}
        <div className={`mt-10 rounded-3xl border p-8 md:p-10 ${CARD}`}>
          <span className={`inline-flex items-center gap-1.5 rounded-full border border-blue-300/50 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${GOLD_TEXT}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            {profilePlan === "admin" ? "Admin" : "Premium"} · Active
          </span>
          <h2 className={`gp-home-display mt-4 text-2xl font-semibold tracking-tight ${HEADING}`}>
            {profilePlan === "admin" ? "You have full access" : "Premium is already active"}
          </h2>
          <p className={`mt-3 max-w-2xl text-sm leading-7 ${BODY}`}>
            {profilePlan === "admin"
              ? "Your account already includes everything — no separate subscription needed."
              : "You're on GamePing Premium. Head to your dashboard or start a new recommendation."}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/dashboard" className="sm:w-auto"><span className={`${GHOST_CTA} sm:w-auto sm:px-6`}>Open dashboard</span></Link>
            <Link href="/recommend" className="sm:w-auto"><span className={`${GHOST_CTA} sm:w-auto sm:px-6`}>New recommendation</span></Link>
            {profilePlan === "premium" ? <ManageBillingButton /> : null}
          </div>
        </div>

        {/* For Creators — admin-only. Admins land on this "full access" panel instead
            of the pricing grid, so the creator card lives here rather than among the
            Free/Premium upsell cards (which make no sense for an account that already
            has everything). Hidden from the public until the programme can pay:
            no referral tracking / payouts yet, /creators is admin-gated in middleware. */}
        {profilePlan === "admin" ? (
          <div className={`relative mt-5 flex flex-col rounded-3xl border p-7 ring-1 ring-blue-400/20 md:p-8 ${CARD}`}>
            <div aria-hidden className="pointer-events-none absolute -inset-2 -z-10 rounded-[1.75rem] bg-blue-500/10 blur-xl" />
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${BODY}`}>For Creators</p>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className={`text-4xl font-semibold tracking-tight ${HEADING}`}>Earn</span>
              <span className={`text-sm ${BODY}`}>with your audience</span>
            </div>
            <p className={`mt-3 text-sm ${BODY}`}>
              Share GamePing with your community and earn recurring commission while referred members stay Premium.
            </p>
            <Link href="/creators" className="mt-6 block sm:w-auto"><span className={`${GHOST_CTA} sm:w-auto sm:px-6`}>Explore the creator program</span></Link>
            <ul className="mt-7 flex flex-col gap-3">
              {[
                `${CREATOR_BASE_COMMISSION_PCT}% recurring commission to start`,
                "Higher tiers as your community grows",
                "One-time milestone bonuses",
              ].map((f) => (
                <li key={f} className={`flex items-start gap-2.5 text-sm ${BODY}`}>
                  <Check className="text-slate-400 dark:text-slate-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </>
    );
  }

  const priceNow = premiumPrice(billingInterval);
  const period = premiumPeriod(billingInterval);

  return (
    <>
      {canceled ? <CanceledBanner /> : null}

      {/* Billing toggle */}
      <div className="mt-10 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.03]">
          {(["month", "year"] as const).map((interval) => (
            <button
              key={interval}
              type="button"
              onClick={() => setBillingInterval(interval)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                billingInterval === interval
                  ? "bg-blue-600 text-white shadow-sm"
                  : `${BODY} hover:text-slate-900 dark:hover:text-white`
              }`}
            >
              {interval === "month" ? "Monthly" : "Yearly"}
              {interval === "year" ? (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${billingInterval === "year" ? "bg-white/20 text-white" : "bg-blue-500/15 text-blue-600 dark:text-blue-300"}`}>
                  −{PREMIUM_YEARLY_SAVINGS_PCT}%
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards — Free, Premium, and the creator "Earn" pillar. */}
      <div className="mx-auto mt-8 grid max-w-5xl items-stretch gap-5 lg:grid-cols-3">
        {/* Free */}
        <div className={`flex h-full flex-col rounded-3xl border p-7 md:p-8 ${CARD}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${BODY}`}>Free</p>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className={`text-4xl font-semibold tracking-tight ${HEADING}`}>{FREE_PRICE}</span>
            <span className={`text-sm ${BODY}`}>/forever</span>
          </div>
          <p className={`mt-3 text-sm ${BODY}`}>Try the core recommendation engine and build your taste.</p>
          <Link href="/recommend" className="mt-6 block"><span className={GHOST_CTA}>Start free</span></Link>
          <ul className="mt-7 flex flex-col gap-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className={`flex items-start gap-2.5 text-sm ${BODY}`}>
                <Check className="text-slate-400 dark:text-slate-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium — taller & elevated (breaks out of the row) */}
        <div className="relative z-10 flex flex-col rounded-3xl border border-blue-300 bg-white p-7 shadow-[0_40px_100px_-36px_rgba(37,99,235,0.5)] dark:border-blue-400/40 dark:bg-white/[0.05] dark:shadow-[0_40px_100px_-40px_rgba(37,99,235,0.7)] md:-my-6 md:p-9">
          <div aria-hidden className="gp-glow-pulse pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-b from-blue-500/30 to-blue-600/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${GOLD_TEXT}`}>Premium</p>
            <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
              Popular
            </span>
          </div>
          {codeInfo?.valid && codeInfo.type === "discount" ? (
            <>
              <div className="mt-4 flex items-baseline gap-2">
                <span className={`text-lg font-semibold line-through ${BODY}`}>{priceNow}</span>
                <span className={`text-4xl font-semibold tracking-tight ${HEADING}`}>{discountedPremiumPrice(billingInterval)}</span>
                <span className={`text-sm ${BODY}`}>{period}</span>
              </div>
              <p className={`mt-1 text-xs ${BODY}`}>
                {discountedPremiumPrice(billingInterval)} the first {billingInterval === "year" ? "year" : "month"}, then {priceNow}{period}.
              </p>
            </>
          ) : (
            <>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className={`text-4xl font-semibold tracking-tight ${HEADING}`}>{priceNow}</span>
                <span className={`text-sm ${BODY}`}>{period}</span>
              </div>
              <p className={`mt-1 text-xs ${BODY}`}>
                {billingInterval === "year"
                  ? `Billed yearly — save ${PREMIUM_YEARLY_SAVINGS_PCT}% vs monthly`
                  : "Billed monthly — cancel anytime"}
              </p>
            </>
          )}
          <p className={`mt-3 text-sm ${BODY}`}>Deeper discovery, deal tracking, and personalization that learns your taste.</p>

          <button
            type="button"
            disabled={loading}
            onClick={startCheckout}
            className={`mt-6 ${GOLD_CTA}`}
          >
            {loading ? "Redirecting…" : billingInterval === "year" ? "Upgrade yearly" : "Upgrade monthly"}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">Secure checkout opens on Stripe.</p>

          <ul className="mt-7 flex flex-col gap-3">
            <li className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${GOLD_TEXT}`}>Everything in Free, plus</li>
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className={`flex items-start gap-2.5 text-sm ${BODY}`}>
                <Check className="text-blue-600 dark:text-blue-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* For Creators — the Earn pillar. */}
        <div className={`flex h-full flex-col rounded-3xl border p-7 md:p-8 ${CARD}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${BODY}`}>For Creators</p>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className={`text-4xl font-semibold tracking-tight ${HEADING}`}>Earn</span>
            <span className={`text-sm ${BODY}`}>with your audience</span>
          </div>
          <p className={`mt-3 text-sm ${BODY}`}>Share GamePing with your community and earn recurring commission while referred members stay Premium.</p>
          <Link href="/creators" className="mt-6 block"><span className={GHOST_CTA}>Explore Earn</span></Link>
          <ul className="mt-7 flex flex-col gap-3">
            {["20% commission to start", "Higher tiers as you grow", "One-time milestone bonuses"].map((f) => (
              <li key={f} className={`flex items-start gap-2.5 text-sm ${BODY}`}>
                <Check className="text-slate-400 dark:text-slate-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Redeem a creator code — horizontal, below the plans */}
      <div className={`mx-auto mt-12 max-w-5xl rounded-3xl border p-6 md:flex md:items-center md:justify-between md:gap-6 ${CARD}`}>
        <div>
          <p className={`text-sm font-bold ${HEADING}`}>Have a creator code?</p>
          <p className={`mt-1 text-sm ${BODY}`}>Enter it here, then pick Premium above — your discount or free trial applies at checkout.</p>
        </div>
        <div className="mt-4 md:mt-0 md:w-80">
          <div className="flex gap-2">
            <input
              id="ref-code"
              type="text"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value.toUpperCase());
                setCodeInfo(null);
              }}
              onBlur={() => validateCode(referralCode)}
              placeholder="e.g. K7QP2M"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono uppercase tracking-widest text-slate-900 placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => validateCode(referralCode)}
              disabled={checkingCode || !referralCode.trim()}
              className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {checkingCode ? "…" : "Apply"}
            </button>
          </div>
          {codeInfo ? (
            codeInfo.valid ? (
              <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ✓{" "}
                {codeInfo.type === "discount"
                  ? "20% off applied at checkout"
                  : codeInfo.type === "trial"
                    ? "7-day free trial applied"
                    : "Creator code applied"}
              </p>
            ) : (
              <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                That code isn&apos;t valid.
              </p>
            )
          ) : null}
        </div>
      </div>
    </>
  );
}

function CanceledBanner() {
  return (
    <div className="mt-8 rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-[#6b5210] dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
      Checkout was canceled. You can try again whenever you&apos;re ready.
    </div>
  );
}

export default function UpgradePage() {
  return (
    <AppPageShell hideAmbient className="overflow-x-hidden">
      <div className="gp-premium relative isolate min-h-0 flex-1 overflow-hidden">
        <UpgradePageAtmosphere />
        <AppSection maxWidth={UPGRADE_PAGE_MAX_WIDTH} className="relative z-10">
          {/* Header */}
          <div className="max-w-2xl">
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${GOLD_TEXT}`}>GamePing Premium</p>
            <h1 className={`gp-home-display mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl ${HEADING}`}>
              Pricing that grows with your taste
            </h1>
            <p className={`mt-5 text-lg leading-relaxed ${BODY}`}>
              Start free and discover games you&apos;ll love. Upgrade to Premium for deeper
              discovery, deal tracking, and personalization that gets smarter over time.
            </p>
            <p className={`mt-4 text-sm ${BODY}`}>{EARLY_ACCESS_NOTICE}</p>
          </div>

          <Suspense
            fallback={
              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                <div className="h-96 animate-pulse rounded-3xl border border-slate-200/70 bg-white/50 motion-reduce:animate-none dark:border-white/[0.06] dark:bg-white/[0.02]" />
                <div className="h-96 animate-pulse rounded-3xl border border-slate-200/70 bg-white/50 motion-reduce:animate-none dark:border-white/[0.06] dark:bg-white/[0.02]" />
                <div className="h-96 animate-pulse rounded-3xl border border-slate-200/70 bg-white/50 motion-reduce:animate-none dark:border-white/[0.06] dark:bg-white/[0.02]" />
              </div>
            }
          >
            <UpgradeContent />
          </Suspense>

          {/* Comparison */}
          <div className="mt-20">
            <h2 className={`gp-home-display text-2xl font-semibold tracking-tight sm:text-3xl ${HEADING}`}>Compare plans</h2>
            <p className={`mt-2 text-sm ${BODY}`}>Everything Free includes, and what Premium adds.</p>
            <ComparisonTable />
          </div>

          {/* FAQ */}
          <div className="mt-20">
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${GOLD_TEXT}`}>FAQ</p>
            <h2 className={`gp-home-display mt-3 text-2xl font-semibold tracking-tight sm:text-3xl ${HEADING}`}>Quick answers</h2>
            <FaqList />
          </div>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
