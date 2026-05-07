"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

function UpgradeContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const canceled = searchParams.get("canceled") === "true";

  async function startCheckout() {
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
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast({
          variant: "error",
          message:
            typeof body.error === "string"
              ? body.error
              : "Checkout could not start. Try again.",
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
            <li>✔ 3 saved searches</li>
            <li>✔ Basic price alerts</li>
            <li>✔ Standard recommendations</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-8 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
          <h2 className="text-2xl font-black">
            Premium <span className="text-cyan-300">+</span>
          </h2>
          <p className="mt-2 text-sm font-bold text-cyan-200">
            Premium — $4.99/month (billed monthly via Stripe)
          </p>
          <p className="mt-2 text-sm text-white/55">
            For people who want alerts that actually feel useful.
          </p>

          <ul className="mt-6 space-y-3 text-white/80">
            <li>✔ 25 saved searches</li>
            <li>✔ Advanced price alerts</li>
            <li>✔ Priority recommendations</li>
            <li>✔ More tracking slots</li>
            <li>✔ Early access features</li>
          </ul>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={loading}
              onClick={startCheckout}
              className="rounded-full bg-cyan-400 px-8 py-4 font-black text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Redirecting…" : "Upgrade with Stripe"}
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
            Save more searches, unlock smarter alerts, and get recommendations tuned to your intent.
          </p>

          <Suspense
            fallback={
              <div className="mt-12 h-40 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
            }
          >
            <UpgradeContent />
          </Suspense>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-black">Quick answers</h2>

            <div className="mt-6 space-y-5 text-white/70">
              <div>
                <p className="font-black text-white">What is a saved search?</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  A saved search stores your taste + budget so GamePing can keep an eye on deals for you.
                </p>
              </div>

              <div>
                <p className="font-black text-white">How do price alerts work?</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  When a tracked game drops under your budget, GamePing sends you a notification.
                </p>
              </div>

              <div>
                <p className="font-black text-white">How does billing work?</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Premium is a monthly subscription processed by Stripe. You can manage payment methods in the Stripe-hosted checkout flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
