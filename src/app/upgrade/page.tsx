"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD_LG,
  APP_KICKER,
  APP_MUTED,
  APP_PAGE_TITLE,
  APP_PRIMARY_CTA_LG,
  APP_PRIMARY_CTA_SM,
  APP_SECONDARY_CTA,
  homeCyanAccentText,
} from "@/components/app/app-styles";
import ManageBillingButton from "@/components/ManageBillingButton";
import PremiumEarlyAccessHint from "@/components/PremiumEarlyAccessHint";
import SteamTasteComingSoon from "@/components/SteamTasteComingSoon";
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

const PREMIUM_CARD =
  "rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/80 via-white to-violet-50/40 p-8 shadow-sm shadow-cyan-100/30";

const PAID_ACTIVE_CARD =
  "rounded-[2rem] border border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-white p-8 shadow-sm md:p-10";

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
      <div className="gp-game-skeleton-bar-light mt-12 h-40 animate-pulse rounded-3xl border border-slate-200/90 bg-white motion-reduce:animate-none" />
    );
  }

  if (hasPaidTier) {
    return (
      <>
        {canceled && (
          <div className="mb-8 rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Checkout was canceled. You can try again whenever you&apos;re ready.
          </div>
        )}

        <div className={`mt-12 ${PAID_ACTIVE_CARD}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">
            Current plan
          </p>
          {profilePlan === "admin" ? (
            <>
              <h2 className="mt-3 text-2xl font-extrabold text-slate-900 md:text-3xl">
                Admin plan active
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                Your account already has full access. You do not need a separate Premium
                subscription.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-2xl font-extrabold text-slate-900 md:text-3xl">
                Premium is already active
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                You&apos;re on GamePing Premium. There&apos;s nothing else to purchase here—head
                to your dashboard or run a new recommendation.
              </p>
            </>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/dashboard" className={APP_PRIMARY_CTA_SM}>
              Open dashboard
            </Link>
            <Link href="/recommend" className={APP_SECONDARY_CTA}>
              New recommendation
            </Link>
            {profilePlan === "premium" ? <ManageBillingButton /> : null}
          </div>
        </div>

        <div className="mt-10 grid gap-6 opacity-90 lg:grid-cols-2">
          <div className={`${APP_CARD_LG} p-8`}>
            <h2 className="text-2xl font-extrabold text-slate-900">Free</h2>
            <p className={`mt-2 ${APP_MUTED}`}>Included baseline.</p>
            <ul className="mt-6 space-y-3 text-slate-600">
              <li>✔ {PLAN_QUOTAS.freeRecommendDaily} recommendations per day</li>
              <li>✔ {PLAN_QUOTAS.freeSavedSearches} saved recommendation runs</li>
              <li>✔ {PLAN_QUOTAS.freeTrackedGames} tracked games</li>
            </ul>
          </div>

          <div className={`${PREMIUM_CARD} p-8`}>
            <h2 className="text-2xl font-extrabold text-slate-900">Premium</h2>
            <p className="mt-2 text-sm font-semibold text-cyan-700">Your current tier</p>
            <ul className="mt-6 space-y-3 text-slate-600">
              <li>✔ Persistent taste memory across sessions</li>
              <li>✔ {PLAN_QUOTAS.premiumSavedSearches} saved recommendation runs</li>
              <li>✔ {PLAN_QUOTAS.premiumTrackedGames} tracked games with deal alerts</li>
              <li>✔ Steam library import (coming soon)</li>
            </ul>
            <PremiumEarlyAccessHint />
            <p className={`mt-6 ${APP_MUTED}`}>
              Use Manage billing to cancel or update your subscription in Stripe&apos;s portal.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {canceled && (
        <div className="mb-8 rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Checkout was canceled. You can try again whenever you&apos;re ready.
        </div>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className={`${APP_CARD_LG} p-8`}>
          <h2 className="text-2xl font-extrabold text-slate-900">Free</h2>
          <p className={`mt-2 ${APP_MUTED}`}>Great to try GamePing.</p>

          <ul className="mt-6 space-y-3 text-slate-600">
            <li>✔ {PLAN_QUOTAS.freeRecommendDaily} recommendations per day</li>
            <li>✔ {PLAN_QUOTAS.freeSavedSearches} saved recommendation runs</li>
            <li>✔ {PLAN_QUOTAS.freeTrackedGames} tracked games</li>
            <li>✔ Build your taste profile over time</li>
          </ul>
        </div>

        <div className={PREMIUM_CARD}>
          <h2 className="text-2xl font-extrabold text-slate-900">Premium</h2>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-700">
            Early supporter pricing
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:items-stretch">
            <button
              type="button"
              onClick={() => setBillingInterval("month")}
              className={`flex h-full flex-col rounded-2xl border p-4 text-left transition ${
                billingInterval === "month"
                  ? "border-cyan-300 bg-cyan-50 ring-2 ring-cyan-500/20"
                  : "border-slate-200/90 bg-white hover:border-cyan-200 hover:shadow-sm"
              }`}
            >
              <span className="block min-h-[1.125rem] text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-slate-500">
                Monthly
              </span>
              <p className="mt-2 flex min-h-8 items-end text-2xl font-extrabold leading-none text-slate-900">
                {PREMIUM_EARLY_ACCESS_PRICE_MONTHLY}
                <span className="text-sm font-semibold text-slate-500">/month</span>
              </p>
              <p className="mt-1 min-h-4 text-xs leading-4 text-slate-400 line-through">
                {PREMIUM_STANDARD_PRICE_MONTHLY_STRIKETHROUGH} standard
              </p>
            </button>

            <button
              type="button"
              onClick={() => setBillingInterval("year")}
              className={`flex h-full flex-col rounded-2xl border p-4 text-left transition ${
                billingInterval === "year"
                  ? "border-cyan-300 bg-cyan-50 ring-2 ring-cyan-500/20"
                  : "border-slate-200/90 bg-white hover:border-cyan-200 hover:shadow-sm"
              }`}
            >
              <span className="block min-h-[1.125rem] text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-violet-700">
                Best value
              </span>
              <p className="mt-2 flex min-h-8 items-end text-2xl font-extrabold leading-none text-slate-900">
                {PREMIUM_EARLY_ACCESS_PRICE_ANNUAL}
                <span className="text-sm font-semibold text-slate-500">/year</span>
              </p>
              <p className="mt-1 min-h-4 text-xs leading-4 text-slate-400 line-through">
                {PREMIUM_STANDARD_PRICE_ANNUAL_STRIKETHROUGH}/year
              </p>
            </button>
          </div>

          <ul className="mt-6 space-y-3 text-slate-700">
            <li>✔ Persistent taste memory across sessions</li>
            <li>✔ {PLAN_QUOTAS.premiumSavedSearches} saved recommendation runs</li>
            <li>✔ {PLAN_QUOTAS.premiumTrackedGames} tracked games with deal alerts</li>
            <li>✔ Steam library import (coming soon)</li>
          </ul>

          <PremiumEarlyAccessHint />

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
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
    </>
  );
}

export default function UpgradePage() {
  const accent = homeCyanAccentText(false);

  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-6xl">
        <p className={APP_KICKER}>GamePing Premium</p>

        <h1 className={APP_PAGE_TITLE}>
          Upgrade to <span className={accent}>GamePing Premium</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          AI game discovery that learns your taste—save searches, track deals, and build a
          personal profile that gets smarter over time.
        </p>

        <p className={`mt-4 max-w-2xl ${APP_MUTED}`}>{EARLY_ACCESS_NOTICE}</p>

        <Suspense
          fallback={
            <div className="gp-game-skeleton-bar-light mt-12 h-40 animate-pulse rounded-3xl border border-slate-200/90 bg-white motion-reduce:animate-none" />
          }
        >
          <UpgradeContent />
        </Suspense>

        <SteamTasteComingSoon idPrefix="upgrade-steam" density="compact" />

        <div className={`mt-12 ${APP_CARD_LG} p-8`}>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 gp-home-display">Quick answers</h2>

          <div className="mt-6 space-y-5">
            <div>
              <p className="font-semibold text-slate-900">What is a saved search?</p>
              <p className={`mt-2 text-sm leading-6 ${APP_MUTED}`}>
                A saved search stores a recommendation run (your prompt and filters) so you can
                revisit it from your dashboard. Price-drop emails come from tracking individual
                games on their game pages.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-900">How do price alerts work?</p>
              <p className={`mt-2 text-sm leading-6 ${APP_MUTED}`}>
                When a tracked game&apos;s verified price drops significantly, GamePing sends you a notification.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-900">How does billing work?</p>
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
    </AppPageShell>
  );
}
