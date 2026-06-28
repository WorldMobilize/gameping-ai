"use client";

import {
  POST_VERIFICATION_REDIRECT,
  sanitizeInternalRedirect,
  VERIFY_SUCCESS_PATH,
} from "@/lib/auth-redirects";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_AUTH_CARD,
  APP_INLINE_LINK_ACCENT,
  APP_INPUT,
  APP_PRIMARY_CTA_ACCENT_SM,
} from "@/components/app/app-styles";
import { useToast } from "@/components/ToastProvider";

function LoginForm() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const redirectParam =
    searchParams.get("redirect") ?? searchParams.get("next");
  const emailVerified = searchParams.get("verified") === "1";
  const authCode = searchParams.get("code");
  const safeRedirect = useMemo(
    () => sanitizeInternalRedirect(redirectParam),
    [redirectParam]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authCode && !emailVerified) {
      const next = encodeURIComponent(VERIFY_SUCCESS_PATH);
      window.location.replace(
        `/auth/callback?code=${encodeURIComponent(authCode)}&next=${next}`
      );
    }
  }, [authCode, emailVerified]);

  useEffect(() => {
    if (!emailVerified) return;
    showToast({
      variant: "success",
      message: "Email verified. You can now log in.",
    });
  }, [emailVerified, showToast]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || hash.includes("type=recovery")) return;
    if (!hash.includes("access_token")) return;

    let cancelled = false;
    void (async () => {
      // Standard Supabase auto-login: getSession() resolves the session parsed
      // from the URL hash (detectSessionInUrl) and persists it before we move on.
      await supabase.auth.getSession();
      if (cancelled) return;
      window.location.replace(POST_VERIFICATION_REDIRECT);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const redirectAfterAuth = useCallback(() => {
    window.location.href = safeRedirect;
  }, [safeRedirect]);

  // If the user verifies their email in the same browser (auto-login via the
  // auth callback), don't leave this tab stale — move it to the destination.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        redirectAfterAuth();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [redirectAfterAuth]);

  const signIn = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showToast({ variant: "error", message: error.message });
        return;
      }

      showToast({
        variant: "success",
        message: "Signed in. Redirecting…",
      });
      setTimeout(() => {
        redirectAfterAuth();
      }, 500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppPageShell hideAmbient>
      {/* Same cinematic background + account (silver) accent as /dashboard and /settings/account. */}
      <div className="gp-accent-page relative isolate flex min-h-0 flex-1 flex-col overflow-hidden">
        <div aria-hidden className="gp-account-bg" />
        <AppSection
          maxWidth="max-w-md"
          className="flex flex-1 items-center justify-center py-12"
        >
          <div className={APP_AUTH_CARD}>
            <h1 className="text-center text-3xl font-black text-slate-900 dark:text-white gp-home-display">
              Welcome back to{" "}
              <span className="text-[color:var(--page-accent-text)]">
                GamePing AI
              </span>
            </h1>

            <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
              Log in to your game preferences and alerts.
            </p>

            {emailVerified ? (
              <p
                className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800"
                role="status"
              >
                Email verified. You can now log in.
              </p>
            ) : null}

            <input
              className={`mt-8 ${APP_INPUT}`}
              placeholder="Email"
              aria-label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              autoComplete="current-password"
              className={`mt-4 ${APP_INPUT}`}
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <p className="mt-2 text-right">
              <Link
                href="/reset-password"
                className={`text-xs ${APP_INLINE_LINK_ACCENT}`}
              >
                Forgot password?
              </Link>
            </p>

            <button
              type="button"
              onClick={signIn}
              disabled={submitting}
              className={`mt-6 w-full ${APP_PRIMARY_CTA_ACCENT_SM} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {submitting ? "Signing in…" : "Log in"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
              New to GamePing?{" "}
              <Link href="/signup" className={APP_INLINE_LINK_ACCENT}>
                Create an account
              </Link>
            </p>

            <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
              By continuing you agree to our{" "}
              <Link href="/terms" className={APP_INLINE_LINK_ACCENT}>
                Terms
              </Link>
              ,{" "}
              <Link href="/privacy" className={APP_INLINE_LINK_ACCENT}>
                Privacy Policy
              </Link>
              ,{" "}
              <Link href="/cookies" className={APP_INLINE_LINK_ACCENT}>
                Cookie Policy
              </Link>
              , and{" "}
              <Link href="/disclaimer" className={APP_INLINE_LINK_ACCENT}>
                Disclaimer
              </Link>
              .
            </p>
          </div>
        </AppSection>
      </div>
    </AppPageShell>
  );
}

function LoginFallback() {
  // Navbar + account background only — no loading card/text flash.
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate flex min-h-0 flex-1 flex-col overflow-hidden">
        <div aria-hidden className="gp-account-bg" />
      </div>
    </AppPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
