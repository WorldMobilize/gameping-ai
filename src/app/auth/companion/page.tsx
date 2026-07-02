"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_AUTH_CARD,
  APP_INLINE_LINK_ACCENT,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
} from "@/components/app/app-styles";

/**
 * Desktop auth handoff — "Connect GamePing Companion".
 *
 * The website is where the user is already logged in. On confirm we hand the
 * current Supabase session to the desktop app via its custom protocol so the app
 * can call POST /api/companion/ask with a Bearer token. Admin-only for now (the
 * API enforces this too; here we gate the UI to avoid a confusing dead-end).
 *
 * Handoff safety: tokens are placed in the URL *fragment* (after `#`), never the
 * query string — fragments are not sent to servers, not written to HTTP access
 * logs, and not leaked via Referer. The confirm is user-initiated (no silent
 * redirect). No custom/temporary admin token is minted; this is the real
 * Supabase session, which the app refreshes itself via refresh_token. A future
 * one-time-code exchange would need a DB table (out of scope here).
 */
const APP_PROTOCOL_CALLBACK = "gameping-companion://auth/callback";
const LOGIN_HREF = `/login?redirect=${encodeURIComponent("/auth/companion")}`;

type Status = "loading" | "anon" | "not_admin" | "ready" | "connected";

export default function CompanionAuthPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session?.user) {
        setStatus("anon");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;

      if (profile?.plan !== "admin") {
        setStatus("not_admin");
        return;
      }

      setSession(session);
      setStatus("ready");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(() => {
    if (!session) return;
    const params = new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      token_type: "bearer",
      expires_at: session.expires_at ? String(session.expires_at) : "",
    });
    // Fragment, not query string — keeps tokens out of server logs / Referer.
    window.location.href = `${APP_PROTOCOL_CALLBACK}#${params.toString()}`;
    setStatus("connected");
  }, [session]);

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6 py-16">
        <div aria-hidden className="gp-landing-bg" />
        <AppSection maxWidth="max-w-md">
          <div className={APP_AUTH_CARD}>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
              GamePing Companion
            </p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white gp-home-display">
              Connect GamePing Companion
            </h1>

            {status === "loading" && (
              <p className={`mt-4 ${APP_MUTED}`}>Checking your account…</p>
            )}

            {status === "anon" && (
              <div className="mt-4 space-y-4">
                <p className="text-slate-700 dark:text-slate-300">
                  You need to be logged in on the website to connect the
                  Companion app.
                </p>
                <Link href={LOGIN_HREF} className={APP_PRIMARY_CTA_ACCENT_SM}>
                  Log in to continue
                </Link>
              </div>
            )}

            {status === "not_admin" && (
              <p className="mt-4 text-slate-700 dark:text-slate-300">
                GamePing Companion is in a limited admin-only Alpha and isn’t
                available on your account yet.
              </p>
            )}

            {status === "ready" && (
              <div className="mt-4 space-y-5">
                <p className="text-slate-700 dark:text-slate-300">
                  This links the desktop Companion app to your GamePing account.
                  Companion asks will be connected to your plan.
                </p>
                <button
                  type="button"
                  onClick={connect}
                  className={APP_PRIMARY_CTA_ACCENT_SM}
                >
                  Connect Companion
                </button>
                <p className={APP_MUTED}>
                  Your browser may ask for permission to open GamePing Companion.
                </p>
              </div>
            )}

            {status === "connected" && (
              <div className="mt-4 space-y-4">
                <p className="text-slate-700 dark:text-slate-300">
                  Opening GamePing Companion… You can return to the app now.
                </p>
                <p className={APP_MUTED}>
                  Nothing happened?{" "}
                  <button
                    type="button"
                    onClick={connect}
                    className={APP_INLINE_LINK_ACCENT}
                  >
                    Try connecting again
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
