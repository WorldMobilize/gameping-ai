"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CARD_LG,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import EmailVerificationNotice from "@/components/EmailVerificationNotice";
import SteamLibraryImportSection from "@/components/SteamLibraryImportSection";
import { supabase } from "@/lib/supabase";

/**
 * Steam Import — the Premium page, and the only place the library is connected.
 *
 * It used to live inside /settings/account, which made "Steam Import" mean two
 * different things depending on where you clicked it: an explainer from one menu,
 * a settings anchor from another. Connecting Steam is not a preference like a
 * password — it is a Premium feature, so it gets a page of its own, twinned with
 * /taste-dna: free and signed-out visitors get the pitch, subscribers get the
 * thing. The drawer and Discovery both fork the same way (explainer → here).
 *
 * Sibling of /taste-dna in shape as well as intent — same shell, same tier
 * states, same gate copy — because the two are read as a pair: your library, and
 * what we build out of it.
 *
 * Reads the plan client-side so the route stays static. The import section does
 * its own server-checked access call (/api/steam/access) and renders nothing
 * without it, so the gate below is the message, never the security.
 */

type Tier = "loading" | "anon" | "free" | "premium";

export default function SteamImportPage() {
  const [tier, setTier] = useState<Tier>("loading");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) {
          if (!cancelled) setTier("anon");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("user_id", user.id)
          .maybeSingle();
        const plan = profile?.plan ?? "free";
        if (!cancelled) {
          setTier(plan === "premium" || plan === "admin" ? "premium" : "free");
        }
      } catch {
        // Fail closed: a broken lookup shows the pitch, never the tool. The tool
        // would render nothing anyway — the section checks access on the server.
        if (!cancelled) setTier("free");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        {/* Fixed cinematic background — SAME image in light + dark. */}
        <div aria-hidden className="gp-account-bg" />
        <AppSection maxWidth="max-w-5xl">
          <EmailVerificationNotice className="mb-8" theme="light" />

          {/* Hero */}
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
            Steam Import
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
            Your <span className="text-[color:var(--page-accent-strong)]">Steam library</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Connect your Steam library and GamePing learns from the games you own and your
            playtime — it stops suggesting what you already have, and it is what your Taste DNA
            is built from.
          </p>

          {/* Loading */}
          {tier === "loading" ? (
            <div className="mt-12" aria-busy="true" aria-live="polite">
              <div className={`${APP_CARD_LG} p-6`}>
                <div className="gp-game-skeleton-bar-light relative mb-5 h-9 max-w-[280px] animate-pulse overflow-hidden rounded-xl bg-slate-100 motion-reduce:animate-none" />
                <div className="gp-game-skeleton-bar-light relative h-24 animate-pulse overflow-hidden rounded-2xl bg-slate-50 motion-reduce:animate-none" />
              </div>
            </div>
          ) : null}

          {/* Free / signed-out gate. Same shape as /taste-dna's — the two pages are
              a pair, and someone bounced between them should not feel a seam. */}
          {tier === "free" || tier === "anon" ? (
            <div className={`mt-12 ${APP_CARD_LG}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--page-accent-text)]">
                Premium
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white gp-home-display">
                Steam Import is a Premium feature
              </h2>
              <p className={`mt-3 max-w-2xl ${APP_MUTED}`}>
                Upgrade to connect your library, so recommendations know what you already own and
                your Taste DNA has something real to learn from.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/upgrade" className={APP_PRIMARY_CTA_ACCENT_SM}>
                  See Premium
                </Link>
                <Link href="/how-it-works/steam-import" className={APP_SECONDARY_CTA}>
                  How it works
                </Link>
              </div>
            </div>
          ) : null}

          {/* Premium — connect, or the library you already connected. The section
              renders both states itself and is a no-op for anyone else. */}
          {tier === "premium" ? (
            <div className="mt-12">
              <SteamLibraryImportSection />
            </div>
          ) : null}
        </AppSection>
      </div>
    </AppPageShell>
  );
}
