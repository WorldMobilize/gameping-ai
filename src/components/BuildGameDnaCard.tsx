"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_PRIMARY_CTA_SM } from "@/components/app/app-styles";
import { supabase } from "@/lib/supabase";

const STEAM_SETTINGS_HREF = "/settings/account#steam-library-import";

/**
 * Shown on game pages when the viewer has no Taste DNA yet. The right call to
 * action depends on who is looking: pointing everyone at Steam import sent free
 * and signed-out visitors to a settings page where the import section is not
 * rendered for them.
 */
type Viewer =
  | { state: "loading" }
  | { state: "anon" }
  | { state: "free" }
  | { state: "can_import" }
  | { state: "import_unavailable" };

export default function BuildGameDnaCard() {
  const [viewer, setViewer] = useState<Viewer>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolveViewer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setViewer({ state: "anon" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      const plan = profile?.plan ?? "free";
      if (plan !== "premium" && plan !== "admin") {
        if (!cancelled) setViewer({ state: "free" });
        return;
      }

      // Premium, but the import can still be off for this deployment (feature
      // flag / admin-only). Ask the server rather than guessing.
      let canImport = false;
      try {
        const res = await fetch("/api/steam/access", { credentials: "include" });
        const json = (await res.json()) as { canImport?: boolean };
        canImport = res.ok && json.canImport === true;
      } catch {
        canImport = false;
      }

      if (!cancelled) {
        setViewer({ state: canImport ? "can_import" : "import_unavailable" });
      }
    }

    void resolveViewer();
    return () => {
      cancelled = true;
    };
  }, []);

  if (viewer.state === "loading") return null;

  const copy = {
    anon: {
      body: "Create a free account and connect your Steam library, and GamePing can explain whether each game matches your taste—not just its genre tags.",
      note: "Your Gaming DNA powers personal fit on every game page.",
      cta: { label: "Create an account", href: "/signup" },
    },
    free: {
      body: "Personal fit is a Premium feature. Upgrade to connect your Steam library, and GamePing can explain whether each game matches your taste—not just its genre tags.",
      note: "Gaming DNA powers fit on game pages. Search recommendations are coming next.",
      cta: { label: "See Premium", href: "/upgrade" },
    },
    can_import: {
      body: "Connect your Steam library and GamePing can explain whether each game matches your taste—not just its genre tags.",
      note: "Gaming DNA powers fit on game pages. Search recommendations are coming next.",
      cta: { label: "Connect Steam", href: STEAM_SETTINGS_HREF },
    },
    import_unavailable: {
      body: "Personal fit reads your Steam library to explain whether each game matches your taste—not just its genre tags.",
      note: "Steam import is not available on your account yet. It is rolling out gradually.",
      cta: null,
    },
  }[viewer.state];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm dark:border-[color:var(--page-accent-border)] dark:bg-white/[0.04] md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--page-accent-text)]">
        Personal fit
      </p>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 gp-home-display dark:text-white md:text-3xl">
        Unlock personal fit insights
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
        {copy.body}
      </p>
      <p className="mt-3 text-sm text-slate-600 dark:text-white/70">{copy.note}</p>
      {copy.cta ? (
        <div className="mt-8">
          <Link href={copy.cta.href} className={APP_PRIMARY_CTA_SM}>
            {copy.cta.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
