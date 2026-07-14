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
import { AuthShell, AUTH_INPUT, AUTH_LABEL } from "@/components/auth/auth-ui";
import {
  APP_INLINE_LINK_ACCENT,
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
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your recommendations, saved searches, and deal alerts."
      footer={
        <>
          New to GamePing?{" "}
          <Link href="/signup" className={APP_INLINE_LINK_ACCENT}>
            Create an account
          </Link>
        </>
      }
    >
      {emailVerified ? (
        <p
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          role="status"
        >
          Email verified. You can now log in.
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className={AUTH_LABEL}>
            Email
          </label>
          <input
            id="login-email"
            className={AUTH_INPUT}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className={`${AUTH_LABEL} mb-0`}>
              Password
            </label>
            <Link href="/reset-password" className={`text-xs ${APP_INLINE_LINK_ACCENT}`}>
              Forgot?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className={AUTH_INPUT}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={signIn}
        disabled={submitting}
        className={`mt-6 w-full ${APP_PRIMARY_CTA_ACCENT_SM} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {submitting ? "Signing in…" : "Log in"}
      </button>

      <p className="mt-6 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
        By continuing you agree to our{" "}
        <Link href="/terms" className={APP_INLINE_LINK_ACCENT}>Terms</Link>,{" "}
        <Link href="/privacy" className={APP_INLINE_LINK_ACCENT}>Privacy Policy</Link>,{" "}
        <Link href="/cookies" className={APP_INLINE_LINK_ACCENT}>Cookie Policy</Link>, and{" "}
        <Link href="/disclaimer" className={APP_INLINE_LINK_ACCENT}>Disclaimer</Link>.
      </p>
    </AuthShell>
  );
}

function LoginFallback() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your GamePing account.">
      <div className="flex flex-col gap-4">
        <div className="h-[70px] rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
        <div className="h-[70px] rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
        <div className="mt-2 h-[46px] rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
