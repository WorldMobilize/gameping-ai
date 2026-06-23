"use client";

import {
  getEmailVerificationRedirectUrl,
  VERIFY_SUCCESS_PATH,
} from "@/lib/auth-redirects";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_AUTH_CARD,
  APP_INLINE_LINK,
  APP_INPUT,
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import { useToast } from "@/components/ToastProvider";
import { validateSignupPassword } from "@/lib/auth-email-verification";
import { trackProductEvent } from "@/lib/product-analytics/client";

const DEFAULT_POST_AUTH_REDIRECT = "/";

/** Only same-origin paths; blocks open redirects and external URLs. */
function sanitizeInternalRedirect(raw: string | null): string {
  if (raw == null || raw === "") return DEFAULT_POST_AUTH_REDIRECT;

  let candidate = raw.trim();
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    return DEFAULT_POST_AUTH_REDIRECT;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_POST_AUTH_REDIRECT;
  }
  if (candidate.includes("://")) {
    return DEFAULT_POST_AUTH_REDIRECT;
  }

  const noHash = candidate.split("#")[0] ?? "";
  if (!noHash.startsWith("/")) {
    return DEFAULT_POST_AUTH_REDIRECT;
  }

  return noHash || DEFAULT_POST_AUTH_REDIRECT;
}

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
      await supabase.auth.signOut();
      if (cancelled) return;
      window.location.replace(VERIFY_SUCCESS_PATH);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const redirectAfterAuth = useCallback(() => {
    window.location.href = safeRedirect;
  }, [safeRedirect]);

  const signUp = async () => {
    const passwordError = validateSignupPassword(password);
    if (passwordError) {
      showToast({ variant: "error", message: passwordError });
      return;
    }

    const emailRedirectTo =
      typeof window !== "undefined"
        ? getEmailVerificationRedirectUrl(window.location.origin)
        : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });

    if (error) {
      showToast({ variant: "error", message: error.message });
      return;
    }

    const user = data.user;

    if (user) {
      await fetch("/api/create-profile", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
        }),
      });
      trackProductEvent("signup_completed");
    }

    if (user && !data.session) {
      showToast({
        variant: "success",
        message:
          "Account created. Check your email to verify your account before using recommendations, saved runs, tracking, and Premium.",
      });
      return;
    }

    showToast({
      variant: "success",
      message: "Account created. Redirecting…",
    });
    setTimeout(() => {
      redirectAfterAuth();
    }, 500);
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToast({ variant: "error", message: error.message });
    } else {
      showToast({
        variant: "success",
        message: "Signed in. Redirecting…",
      });
      setTimeout(() => {
        redirectAfterAuth();
      }, 500);
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
              Welcome to <span className="text-[color:var(--page-accent-text)]">GamePing AI</span>
            </h1>

          <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
            Save your game preferences and get smart alerts.
          </p>

          {emailVerified ? (
            <p
              className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800"
              role="status"
            >
              Email verified. You can now log in.
            </p>
          ) : null}

          <ul className="mt-6 space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <li className="flex gap-2">
              <span className="text-[color:var(--page-accent-text)]">✓</span>
              <span>Save recommendation runs to your dashboard</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--page-accent-text)]">✓</span>
              <span>Track games and get price alerts</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--page-accent-text)]">✓</span>
              <span>Keep your game discovery organized</span>
            </li>
          </ul>

          <p className="mt-5 text-center">
            <Link href="/upgrade" className={`text-xs ${APP_INLINE_LINK}`}>
              Compare Free vs Premium
            </Link>
          </p>

          <input
            className={`mt-8 ${APP_INPUT}`}
            placeholder="Email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className={`mt-4 ${APP_INPUT}`}
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Password: at least 8 characters with one letter and one number.
          </p>

          <p className="mt-2 text-right">
            <Link href="/reset-password" className={`text-xs ${APP_INLINE_LINK}`}>
              Forgot password?
            </Link>
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={signIn}
              className={`${APP_PRIMARY_CTA_ACCENT_SM} w-full`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={signUp}
              className={`${APP_SECONDARY_CTA} w-full`}
            >
              Sign up
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
            By continuing you agree to our{" "}
            <Link href="/terms" className={APP_INLINE_LINK}>
              Terms
            </Link>
            ,{" "}
            <Link href="/privacy" className={APP_INLINE_LINK}>
              Privacy Policy
            </Link>
            ,{" "}
            <Link href="/cookies" className={APP_INLINE_LINK}>
              Cookie Policy
            </Link>
            , and{" "}
            <Link href="/disclaimer" className={APP_INLINE_LINK}>
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
