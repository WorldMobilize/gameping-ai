"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_MUTED,
  APP_PRIMARY_CTA_LG,
  APP_PRIMARY_CTA_SM,
  APP_SECONDARY_CTA,
  APP_SECTION_TITLE,
  APP_SECTION_TITLE_LG,
} from "@/components/app/app-styles";
import ManageBillingButton from "@/components/ManageBillingButton";
import FreeWhyUpgradePanel from "@/components/upgrade/FreeWhyUpgradePanel";
import PremiumComingSoonPanel from "@/components/upgrade/PremiumComingSoonPanel";
import PremiumFeatureCards from "@/components/upgrade/PremiumFeatureCards";
import UpgradePageAtmosphere from "@/components/upgrade/UpgradePageAtmosphere";
import {
  FREE_COLUMN,
  FREE_PLAN_CARD,
  PREMIUM_CARD_GLOW,
  PREMIUM_CARD_COLUMN,
  PREMIUM_INCLUDED_PANEL,
  PREMIUM_PLAN_CARD,
  PRICING_GRID,
  PRICING_SECTION,
  RECOMMENDED_RIBBON,
  UPGRADE_FAQ_SECTION,
  UPGRADE_PAGE_MAX_WIDTH,
  UPGRADE_STEAM_SECTION,
} from "@/components/upgrade/upgrade-plan-styles";
import { PLAN_QUOTAS } from "@/lib/plan-quotas";
import {
  EARLY_ACCESS_NOTICE,
  PREMIUM_EARLY_ACCESS_PRICE_ANNUAL,
  PREMIUM_EARLY_ACCESS_PRICE_MONTHLY,
  PREMIUM_STANDARD_PRICE_ANNUAL_STRIKETHROUGH,
  PREMIUM_STANDARD_PRICE_MONTHLY_STRIKETHROUGH,
} from "@/lib/product-copy";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

type LoadedPlan = "free" | "premium" | "admin" | null;

const PAID_ACTIVE_CARD =
  "rounded-3xl border border-slate-200/90 bg-white/70 p-8 shadow-sm shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-slate-950/40 md:p-10";

/**
 * Premium page identity = warm gold / champagne (the "upgrade" tier), as
 * opposed to GamePing's cyan "discovery" accent used everywhere else. These are
 * page-local so the shared APP_* cyan tokens stay cyan on every other page.
 */
const PREMIUM_KICKER =
  "text-xs font-semibold uppercase tracking-[0.35em] text-[#a17c1e] dark:text-[#e8c879]";
const PREMIUM_ACCENT = "text-[#a17c1e] dark:text-[#e8c879]";

/** Page header text floats over the dark cinematic room → light in both themes. */
const PREMIUM_PAGE_TITLE =
  "mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display";

/** Frosted gold surface for the FAQ card (frosted light glass in light mode via
 *  the .gp-premium .bg-white rule; dark glass in dark mode) with a gold border. */
const PREMIUM_SURFACE_CARD =
  "rounded-3xl border border-amber-300/50 bg-white p-6 shadow-sm shadow-amber-200/20 dark:border-amber-700/30 dark:bg-slate-900/70 dark:shadow-amber-950/20";

function UpgradeContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("year");
  const [planLoading, setPlanLoading] = useState(true);
  const [profilePlan, setProfilePlan] = useState<LoadedPlan>(null);

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

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: billingInterval }),
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
        showToast({
          variant: "error",
          message: "No checkout URL returned.",
        });
        return;
      }

      window.location.href = url;
    } catch {
      showToast({
        variant: "error",
        message: "Something went wrong. Try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const hasPaidTier = profilePlan === "premium" || profilePlan === "admin";

  if (planLoading) {
    return (
      <div className="gp-game-skeleton-bar-light mt-12 h-40 animate-pulse rounded-3xl border border-slate-200/90 bg-white motion-reduce:animate-none dark:border-slate-800/80 dark:bg-slate-900/70" />
    );
  }

  if (hasPaidTier) {
    return (
      <>
        {canceled && (
          <div className="mb-8 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-[#6b5210] dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
            Checkout was canceled. You can try again whenever you&apos;re ready.
          </div>
        )}

        <div className={`mt-12 ${PAID_ACTIVE_CARD}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-slate-400">
            Current plan
          </p>
          {profilePlan === "admin" ? (
            <>
              <h2 className={`mt-3 ${APP_SECTION_TITLE_LG}`}>
                Admin plan active
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
                Your account already has full access. You do not need a separate Premium
                subscription.
              </p>
            </>
          ) : (
            <>
              <h2 className={`mt-3 ${APP_SECTION_TITLE_LG}`}>
                Premium is already active
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
                You&apos;re on GamePing Premium. There&apos;s nothing else to purchase here—head
                to your dashboard or run a new recommendation.
              </p>
            </>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/dashboard" className={APP_SECONDARY_CTA}>
              Open dashboard
            </Link>
            <Link href="/recommend" className={APP_SECONDARY_CTA}>
              New recommendation
            </Link>
            {profilePlan === "premium" ? <ManageBillingButton /> : null}
          </div>
        </div>

        <div className={`${PRICING_SECTION} opacity-95`}>
          <div className={PRICING_GRID}>
          <div className={FREE_COLUMN}>
          <div className={FREE_PLAN_CARD}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                  Starter discovery
                </span>
                <h2 className={`mt-4 ${APP_SECTION_TITLE}`}>Free</h2>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  Try the core recommendation engine.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                Included
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-950/25">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Best for</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                Casual discovery and testing GamePing.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-[#8a6a14] dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
                {PLAN_QUOTAS.freeRecommendDaily}/day
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-[#8a6a14] dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
                {PLAN_QUOTAS.freeSavedSearches} saves
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-[#8a6a14] dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
                {PLAN_QUOTAS.freeTrackedGames} tracked
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/70">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">
                Included
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex gap-2">
                  <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                    ✓
                  </span>
                  {PLAN_QUOTAS.freeRecommendDaily} recommendations per day
                </li>
                <li className="flex gap-2">
                  <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                    ✓
                  </span>
                  {PLAN_QUOTAS.freeSavedSearches} saved recommendation runs
                </li>
                <li className="flex gap-2">
                  <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                    ✓
                  </span>
                  {PLAN_QUOTAS.freeTrackedGames} tracked games
                </li>
                <li className="flex gap-2">
                  <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                    ✓
                  </span>
                  Build your taste profile over time
                </li>
              </ul>
            </div>

            <p className={`mt-5 text-sm ${APP_MUTED}`}>Good for trying GamePing.</p>
          </div>

          <FreeWhyUpgradePanel />
          </div>

          <div className={PREMIUM_CARD_COLUMN}>
            <div className={PREMIUM_CARD_GLOW} aria-hidden />
            <div className={PREMIUM_PLAN_CARD}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-200/40 via-amber-50/20 to-transparent dark:from-amber-400/15 dark:via-amber-950/10" aria-hidden />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a14] dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                  Premium discovery
                </span>
                <h2 className={`mt-4 ${APP_SECTION_TITLE}`}>Premium</h2>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  Built for deeper discovery and deal tracking.
                </p>
              </div>
              <span className="rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a6a14] dark:border-amber-700/40 dark:bg-slate-950/40 dark:text-amber-200">
                Active
              </span>
            </div>

            <div className={`mt-6 ${PREMIUM_INCLUDED_PANEL}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a14] dark:text-amber-300">
                Included in Premium
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex gap-2">
                  <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                    ✓
                  </span>
                  Persistent taste memory across sessions
                </li>
                <li className="flex gap-2">
                  <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                    ✓
                  </span>
                  {PLAN_QUOTAS.premiumSavedSearches} saved recommendation runs
                </li>
                <li className="flex gap-2">
                  <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                    ✓
                  </span>
                  {PLAN_QUOTAS.premiumTrackedGames} tracked games with deal alerts
                </li>
                <li className="flex gap-2">
                  <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                    ✓
                  </span>
                  {PLAN_QUOTAS.premiumRecommendDaily} recommendations per day
                </li>
              </ul>
            </div>

            <PremiumComingSoonPanel />

            <div className="mt-6 border-t border-amber-300/50 pt-5 dark:border-amber-800/40">
              <p className={`text-sm leading-6 ${APP_MUTED}`}>
                Use Manage billing to cancel or update your subscription in Stripe&apos;s portal.
              </p>
            </div>
            </div>
          </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {canceled && (
        <div className="mb-8 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-[#6b5210] dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
          Checkout was canceled. You can try again whenever you&apos;re ready.
        </div>
      )}

      <div className={PRICING_SECTION}>
        <div className={PRICING_GRID}>
        <div className={FREE_COLUMN}>
        <div className={FREE_PLAN_CARD}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                Starter discovery
              </span>
              <h2 className={`mt-4 ${APP_SECTION_TITLE}`}>Free</h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Try the core recommendation engine.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
              Best for testing
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-950/25">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Best for</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Casual discovery and testing GamePing.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-[#8a6a14] dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
              {PLAN_QUOTAS.freeRecommendDaily}/day
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-[#8a6a14] dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
              {PLAN_QUOTAS.freeSavedSearches} saves
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-[#8a6a14] dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
              {PLAN_QUOTAS.freeTrackedGames} tracked
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">
              Included
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                  ✓
                </span>
                {PLAN_QUOTAS.freeRecommendDaily} recommendations per day
              </li>
              <li className="flex gap-2">
                <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                  ✓
                </span>
                {PLAN_QUOTAS.freeSavedSearches} saved recommendation runs
              </li>
              <li className="flex gap-2">
                <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                  ✓
                </span>
                {PLAN_QUOTAS.freeTrackedGames} tracked games
              </li>
              <li className="flex gap-2">
                <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                  ✓
                </span>
                Build your taste profile over time
              </li>
            </ul>
          </div>

          <p className={`mt-5 text-sm ${APP_MUTED}`}>Good for trying GamePing.</p>
        </div>

        <FreeWhyUpgradePanel />
        </div>

        <div className={PREMIUM_CARD_COLUMN}>
          <div className={PREMIUM_CARD_GLOW} aria-hidden />
          <div className={PREMIUM_PLAN_CARD}>
          <span className={RECOMMENDED_RIBBON}>Recommended</span>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-200/40 via-amber-50/20 to-transparent dark:from-amber-400/15 dark:via-amber-950/10" aria-hidden />
          <div className="flex flex-wrap items-start justify-between gap-4 pt-2">
            <div>
              <span className="inline-flex rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a14] dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                Premium discovery
              </span>
              <h2 className={`mt-4 ${APP_SECTION_TITLE}`}>Premium</h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Built for deeper discovery and deal tracking.
              </p>
            </div>
            <span className="rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a6a14] dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
              Early supporter pricing
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 sm:items-stretch">
            <button
              type="button"
              onClick={() => setBillingInterval("month")}
              className={`flex h-full flex-col rounded-2xl border p-4 text-left transition ${
                billingInterval === "month"
                  ? "border-amber-300 bg-amber-50 ring-2 ring-amber-500/20 dark:border-amber-500/40 dark:bg-amber-950/40 dark:ring-amber-500/15"
                  : "border-slate-200/90 bg-white hover:border-amber-200 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:border-amber-700/40"
              }`}
            >
              <span className="block min-h-[1.125rem] text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-slate-600 dark:text-slate-400">
                Monthly
              </span>
              <p className="mt-2 flex min-h-8 items-end text-2xl font-extrabold leading-none text-[#9a7518] dark:text-[#ecce82]">
                {PREMIUM_EARLY_ACCESS_PRICE_MONTHLY}
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">/month</span>
              </p>
              <p className="mt-1 min-h-4 text-xs leading-4 text-slate-500 line-through dark:text-slate-400">
                {PREMIUM_STANDARD_PRICE_MONTHLY_STRIKETHROUGH} standard
              </p>
            </button>

            <button
              type="button"
              onClick={() => setBillingInterval("year")}
              className={`flex h-full flex-col rounded-2xl border p-4 text-left transition ${
                billingInterval === "year"
                  ? "border-amber-300 bg-amber-50 ring-2 ring-amber-500/20 dark:border-amber-500/40 dark:bg-amber-950/40 dark:ring-amber-500/15"
                  : "border-slate-200/90 bg-white hover:border-amber-200 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:border-amber-700/40"
              }`}
            >
              <span className="block min-h-[1.125rem] text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-[#8a6a14] dark:text-amber-300">
                Best value
              </span>
              <p className="mt-2 flex min-h-8 items-end text-2xl font-extrabold leading-none text-[#9a7518] dark:text-[#ecce82]">
                {PREMIUM_EARLY_ACCESS_PRICE_ANNUAL}
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">/year</span>
              </p>
              <p className="mt-1 min-h-4 text-xs leading-4 text-slate-500 line-through dark:text-slate-400">
                {PREMIUM_STANDARD_PRICE_ANNUAL_STRIKETHROUGH}/year
              </p>
            </button>
          </div>

          <div className={`mt-7 ${PREMIUM_INCLUDED_PANEL}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a14] dark:text-amber-300">
              Included in Premium
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                  ✓
                </span>
                Persistent taste memory across sessions
              </li>
              <li className="flex gap-2">
                <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                  ✓
                </span>
                {PLAN_QUOTAS.premiumSavedSearches} saved recommendation runs
              </li>
              <li className="flex gap-2">
                <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                  ✓
                </span>
                {PLAN_QUOTAS.premiumTrackedGames} tracked games with deal alerts
              </li>
              <li className="flex gap-2">
                <span className="text-[#a17c1e] dark:text-[#e8c879]" aria-hidden>
                  ✓
                </span>
                {PLAN_QUOTAS.premiumRecommendDaily} recommendations per day
              </li>
            </ul>
          </div>

          <PremiumComingSoonPanel />

          <div className="mt-6 border-t border-amber-300/50 pt-5 dark:border-amber-800/40">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={loading}
                onClick={startCheckout}
                className={`${APP_PRIMARY_CTA_LG} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {loading
                  ? "Redirecting…"
                  : billingInterval === "year"
                    ? "Upgrade yearly with Stripe"
                    : "Upgrade monthly with Stripe"}
              </button>
              <span className={APP_MUTED}>Secure checkout opens on Stripe.</span>
            </div>
          </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

export default function UpgradePage() {
  return (
    <AppPageShell hideAmbient className="overflow-x-hidden">
      <div className="gp-premium relative isolate min-h-0 flex-1 overflow-hidden">
        <UpgradePageAtmosphere />
        <AppSection maxWidth={UPGRADE_PAGE_MAX_WIDTH} className="relative z-10">
        <p className={PREMIUM_KICKER}>GamePing Premium</p>

        <h1 className={PREMIUM_PAGE_TITLE}>
          Upgrade to <span className={PREMIUM_ACCENT}>GamePing Premium</span>
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          AI game discovery that learns your taste—save searches, track deals, and build a
          personal profile that gets smarter over time.
        </p>

        <p className="mt-4 max-w-3xl text-sm text-slate-300">{EARLY_ACCESS_NOTICE}</p>

        <Suspense
          fallback={
            <div className="gp-game-skeleton-bar-light mt-12 h-40 animate-pulse rounded-3xl border border-slate-200/90 bg-white motion-reduce:animate-none dark:border-slate-800/80 dark:bg-slate-900/70" />
          }
        >
          <UpgradeContent />
        </Suspense>

        <section className={UPGRADE_STEAM_SECTION}>
          <div className="relative z-10 mx-auto w-full max-w-5xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-600 dark:text-violet-300">
              Premium personalization
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl gp-home-display">
              Two live sources behind your picks
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              GamePing learns from your Steam library and builds a gaming identity — then uses both to power Weekly Picks, Deals For You, and Monthly Recap.
            </p>
            <PremiumFeatureCards />
          </div>
        </section>

        <div className={`${UPGRADE_FAQ_SECTION} ${PREMIUM_SURFACE_CARD} p-8`}>
          <p className={PREMIUM_KICKER}>
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white gp-home-display">Quick answers</h2>

          <div className="mt-6 space-y-5">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">What is a saved search?</p>
              <p className={`mt-2 text-sm leading-6 ${APP_MUTED}`}>
                A saved search stores a recommendation run (your prompt and filters) so you can
                revisit it from your dashboard. Price-drop emails come from tracking individual
                games on their game pages.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-900 dark:text-white">How do price alerts work?</p>
              <p className={`mt-2 text-sm leading-6 ${APP_MUTED}`}>
                When a tracked game&apos;s verified price drops significantly, GamePing sends you a notification.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-900 dark:text-white">How does billing work?</p>
              <p className={`mt-2 text-sm leading-6 ${APP_MUTED}`}>
                Premium is billed monthly or yearly through Stripe. After checkout, your plan
                updates automatically when your subscription status changes. To cancel or change
                billing, open Manage billing on your account or upgrade page (Premium subscribers),
                or use the Stripe Customer Portal from there.
              </p>
            </div>
          </div>
        </div>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
