"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/auth-ui";
import {
  APP_INLINE_LINK_ACCENT,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
} from "@/components/app/app-styles";

/**
 * Desktop auth handoff — "Connect GamePing Companion".
 *
 * The website is where the user is already logged in. On confirm we hand the
 * current Supabase session to the desktop app via its custom protocol so the app
 * can call POST /api/companion/ask with a Bearer token. Open to any authenticated
 * GamePing user (free + premium), matching the ask/me endpoints.
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

      // Any authenticated GamePing user can connect (public beta) — matches the
      // /api/companion/ask and /api/companion/me endpoints, which allow free and
      // premium alike. The deep-link fragment format is unchanged.
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

  // The primary/fallback controls are real <a href={deepLink}> anchors — a
  // native click reliably launches the custom protocol. This handler must NOT
  // preventDefault: it only advances the UI while the browser performs the
  // anchor's default navigation to the app.
  const handleOpen = useCallback(() => {
    setStatus("connected");
  }, []);

  return (
    <AuthShell showBack={false}>
      <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
              GamePing Companion
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white gp-home-display">
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
                GamePing Companion isn’t available on your account yet.
              </p>
            )}

            {status === "ready" && (
              <div className="mt-4 space-y-5">
                <p className="text-slate-700 dark:text-slate-300">
                  This links the desktop Companion app to your GamePing account.
                  Companion asks will be connected to your plan.
                </p>
                <a
                  href={deepLink}
                  onClick={handleOpen}
                  className={APP_PRIMARY_CTA_ACCENT_SM}
                >
                  Open GamePing Companion
                </a>
                <p className={APP_MUTED}>
                  Chrome will ask for permission to open GamePing Companion —
                  choose Open to continue.
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
                  <a
                    href={deepLink}
                    onClick={handleOpen}
                    className={APP_INLINE_LINK_ACCENT}
                  >
                    Try connecting again
                  </a>
                  .
                </p>
              </div>
            )}

      </div>
    </AuthShell>
  );
}
