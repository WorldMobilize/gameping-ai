"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ManageBillingButton from "@/components/ManageBillingButton";
import Navbar from "@/components/Navbar";
import PremiumEarlyAccessHint from "@/components/PremiumEarlyAccessHint";
import SteamTasteComingSoon from "@/components/SteamTasteComingSoon";
import { PLAN_QUOTAS } from "@/lib/plan-quotas";
import {
  EARLY_ACCESS_NOTICE,
  PREMIUM_ANNUAL_SAVE_LABEL,
  PREMIUM_EARLY_ACCESS_PRICE_ANNUAL,
  PREMIUM_EARLY_ACCESS_PRICE_MONTHLY,
  PREMIUM_STANDARD_PRICE_ANNUAL_STRIKETHROUGH,
  PREMIUM_STANDARD_PRICE_MONTHLY_STRIKETHROUGH,
} from "@/lib/product-copy";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

type LoadedPlan = "free" | "premium" | "admin" | null;

function UpgradeContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "year"
  );
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
      <div className="mt-12 h-40 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
    );
  }

  if (hasPaidTier) {
    return (
      <>
        {canceled && (
          <div className="mb-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Checkout was canceled. You can try again whenever you’re ready.
          </div>
        )}

        <div className="mt-12 rounded-[2rem] border border-emerald-400/30 bg-emerald-500/10 p-8 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-200">
            Current plan
          </p>
          {profilePlan === "admin" ? (
            <>
              <h2 className="mt-3 text-2xl font-black md:text-3xl">
                Admin plan active
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                Your account already has full access. You do not need a separate Premium
                subscription.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-2xl font-black md:text-3xl">
                Premium is already active
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                You&apos;re on GamePing Premium. There&apos;s nothing else to purchase here—head
                to your dashboard or run a new recommendation.
              </p>
            </>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-8 py-3.5 text-sm font-black text-black shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300"
            >
              Open dashboard
            </Link>
            <Link
              href="/recommend"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-8 py-3.5 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              New recommendation
            </Link>
            {profilePlan === "premium" ? (
              <ManageBillingButton className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-8 py-3.5 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-60" />
            ) : null}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2 opacity-60">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-2xl font-black">Free</h2>
            <p className="mt-2 text-sm text-white/50">Included baseline.</p>
            <ul className="mt-6 space-y-3 text-white/60">
              <li>✔ {PLAN_QUOTAS.freeRecommendDaily} recommendations per day</li>
              <li>✔ {PLAN_QUOTAS.freeSavedSearches} saved recommendation runs</li>
              <li>✔ {PLAN_QUOTAS.freeTrackedGames} tracked games</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-8">
            <h2 className="text-2xl font-black">Premium</h2>
            <p className="mt-2 text-sm font-bold text-cyan-200">Your current tier</p>
            <ul className="mt-6 space-y-3 text-white/70">
              <li>✔ Persistent taste memory across sessions</li>
              <li>✔ {PLAN_QUOTAS.premiumSavedSearches} saved recommendation runs</li>
              <li>✔ {PLAN_QUOTAS.premiumTrackedGames} tracked games with deal alerts</li>
              <li>✔ Steam library import (coming soon)</li>
            </ul>
            <PremiumEarlyAccessHint />
            <p className="mt-6 text-sm text-white/45">
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
        <div className="mb-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Checkout was canceled. You can try again whenever you’re ready.
        </div>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-black">Free</h2>
          <p className="mt-2 text-sm text-white/50">Great to try GamePing.</p>

          <ul className="mt-6 space-y-3 text-white/70">
            <li>✔ {PLAN_QUOTAS.freeRecommendDaily} recommendations per day</li>
            <li>✔ {PLAN_QUOTAS.freeSavedSearches} saved recommendation runs</li>
            <li>✔ {PLAN_QUOTAS.freeTrackedGames} tracked games</li>
            <li>✔ Build your taste profile over time</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-8 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
          <h2 className="text-2xl font-black">Premium</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200/90">
            Early supporter pricing
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:items-stretch">
            <button
              type="button"
              onClick={() => setBillingInterval("month")}
              className={`flex h-full flex-col rounded-2xl border p-4 text-left transition ${
                billingInterval === "month"
                  ? "border-cyan-400/50 bg-cyan-400/15 ring-1 ring-cyan-400/30"
                  : "border-white/10 bg-black/20 hover:border-white/20"
              }`}
            >
              <span className="block min-h-[1.125rem] text-[10px] font-black uppercase leading-none tracking-[0.2em] text-white/45">
                Monthly
              </span>
              <p className="mt-2 flex min-h-8 items-end text-2xl font-black leading-none text-white">
                {PREMIUM_EARLY_ACCESS_PRICE_MONTHLY}
                <span className="text-sm font-bold text-white/55">/month</span>
              </p>
              <p className="mt-1 min-h-4 text-xs leading-4 text-white/40 line-through">
                {PREMIUM_STANDARD_PRICE_MONTHLY_STRIKETHROUGH} standard
              </p>
              <p className="mt-1 min-h-4 text-xs leading-4 text-white/50">
                <span className="invisible select-none" aria-hidden="true">
                  {PREMIUM_ANNUAL_SAVE_LABEL}
                </span>
              </p>
            </button>

            <button
              type="button"
              onClick={() => setBillingInterval("year")}
              className={`flex h-full flex-col rounded-2xl border p-4 text-left transition ${
                billingInterval === "year"
                  ? "border-cyan-400/50 bg-cyan-400/15 ring-1 ring-cyan-400/30"
                  : "border-white/10 bg-black/20 hover:border-white/20"
              }`}
            >
              <span className="block min-h-[1.125rem] text-[10px] font-black uppercase leading-none tracking-[0.2em] text-purple-200">
                Best value
              </span>
              <p className="mt-2 flex min-h-8 items-end text-2xl font-black leading-none text-white">
                {PREMIUM_EARLY_ACCESS_PRICE_ANNUAL}
                <span className="text-sm font-bold text-white/55">/year</span>
              </p>
              <p className="mt-1 min-h-4 text-xs leading-4 text-white/40 line-through">
                {PREMIUM_STANDARD_PRICE_ANNUAL_STRIKETHROUGH}/year
              </p>
              <p className="mt-1 min-h-4 text-xs leading-4 text-white/50">
                {PREMIUM_ANNUAL_SAVE_LABEL}
              </p>
            </button>
          </div>

          <ul className="mt-6 space-y-3 text-white/80">
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
              className="rounded-full bg-cyan-400 px-8 py-4 font-black text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Redirecting…"
                : billingInterval === "year"
                  ? "Upgrade yearly with Stripe"
                  : "Upgrade monthly with Stripe"}
            </button>

            <span className="text-sm text-white/55">
              Secure checkout opens on Stripe.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function UpgradePage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.5em] text-cyan-300">
            GamePing Premium
          </p>

          <h1 className="text-4xl font-black md:text-6xl">
            Upgrade to <span className="text-cyan-300">GamePing Premium</span>
          </h1>

          <p className="mt-4 max-w-2xl text-white/60">
            AI game discovery that learns your taste—save searches, track deals, and build a
            personal profile that gets smarter over time.
          </p>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/45">
            {EARLY_ACCESS_NOTICE}
          </p>

          <Suspense
            fallback={
              <div className="mt-12 h-40 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
            }
          >
            <UpgradeContent />
          </Suspense>

          <SteamTasteComingSoon idPrefix="upgrade-steam" density="compact" />

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-black">Quick answers</h2>

            <div className="mt-6 space-y-5 text-white/70">
              <div>
                <p className="font-black text-white">What is a saved search?</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  A saved search stores a recommendation run (your prompt and filters) so you can
                  revisit it from your dashboard. Price-drop emails come from tracking individual
                  games on their game pages.
                </p>
              </div>

              <div>
                <p className="font-black text-white">How do price alerts work?</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  When a tracked game&apos;s verified price drops significantly, GamePing sends you a notification.
                </p>
              </div>

              <div>
                <p className="font-black text-white">How does billing work?</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Premium is billed monthly or yearly through Stripe. After checkout, your plan
                  updates automatically when your subscription status changes. To cancel or change
                  billing, open Manage billing on your account or upgrade page (Premium subscribers),
                  or use the Stripe Customer Portal from there.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
