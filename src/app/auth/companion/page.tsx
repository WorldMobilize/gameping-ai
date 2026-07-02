"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

  // The exact deep link we open. Built from the live Supabase session; empty
  // until an admin session has loaded. Tokens live in the hash fragment (after
  // `#`), never the query string, so they stay out of server logs / Referer.
  //
  // Supabase tokens are URL-safe (JWT = base64url; refresh token = alphanumeric),
  // so we join the fragment with raw values to match the manual test format
  // exactly — no percent-encoding, no `+`-for-space surprises from
  // URLSearchParams. `#` is a literal separator (never encoded as %23).
  const deepLink = useMemo(() => {
    if (!session) return "";
    const fragment = [
      `access_token=${session.access_token}`,
      `refresh_token=${session.refresh_token}`,
      `token_type=bearer`,
      `expires_at=${session.expires_at ?? ""}`,
    ].join("&");
    return `${APP_PROTOCOL_CALLBACK}#${fragment}`;
  }, [session]);

  const connect = useCallback(() => {
    if (!deepLink) return;
    // TEMPORARY DEBUG — log the exact deep link we hand to the desktop app.
    console.log("[companion] Generated deep link:", deepLink);
    window.location.href = deepLink;
    setStatus("connected");
  }, [deepLink]);

  const [copied, setCopied] = useState(false);
  const copyDeepLink = useCallback(async () => {
    if (!deepLink) return;
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — the URL is still visible below to copy manually.
    }
  }, [deepLink]);

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

            {/* TEMPORARY DEBUG (admin-only) — remove once the handoff is verified.
             * Only renders when an admin session has produced a deep link. */}
            {deepLink && (
              <div className="mt-6 border-t border-dashed border-slate-300/70 pt-4 dark:border-slate-700/70">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--page-accent-strong)]">
                  Debug · admin only
                </p>
                <p className={`mt-2 ${APP_MUTED}`}>Generated deep link:</p>
                <code className="mt-1 block max-h-40 overflow-auto break-all rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                  {deepLink}
                </code>
                <button
                  type="button"
                  onClick={copyDeepLink}
                  className={`mt-3 ${APP_PRIMARY_CTA_ACCENT_SM}`}
                >
                  {copied ? "Copied ✓" : "Copy deep link"}
                </button>
              </div>
            )}
          </div>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
