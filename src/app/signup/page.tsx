"use client";

import {
  CHECK_EMAIL_PATH,
  getEmailVerificationRedirectUrl,
  PENDING_VERIFICATION_EMAIL_KEY,
  sanitizeInternalRedirect,
} from "@/lib/auth-redirects";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_AUTH_CARD,
  APP_INLINE_LINK,
  APP_INPUT,
  APP_PRIMARY_CTA_ACCENT_SM,
} from "@/components/app/app-styles";
import { useToast } from "@/components/ToastProvider";
import { validateSignupPassword } from "@/lib/auth-email-verification";
import { trackProductEvent } from "@/lib/product-analytics/client";

function SignupForm() {
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam =
    searchParams.get("redirect") ?? searchParams.get("next");
  const safeRedirect = useMemo(
    () => sanitizeInternalRedirect(redirectParam),
    [redirectParam]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectAfterAuth = useCallback(() => {
    window.location.href = safeRedirect;
  }, [safeRedirect]);

  // If the user verifies their email in this same browser (auto-login via the
  // auth callback in another tab), don't leave this tab stale.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        redirectAfterAuth();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [redirectAfterAuth]);

  const signUp = async () => {
    if (submitting) return;

    const passwordError = validateSignupPassword(password);
    if (passwordError) {
      showToast({ variant: "error", message: passwordError });
      return;
    }

    setSubmitting(true);
    try {
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
        // Email confirmation required: hand off to the dedicated check-email
        // page and clear the form so no credentials linger on this tab.
        const pendingEmail = email.trim();
        try {
          window.sessionStorage.setItem(
            PENDING_VERIFICATION_EMAIL_KEY,
            pendingEmail
          );
        } catch {}
        setEmail("");
        setPassword("");
        router.push(CHECK_EMAIL_PATH);
        return;
      }

      // No confirmation step (session returned): clear credentials and go home.
      setEmail("");
      setPassword("");
      showToast({
        variant: "success",
        message: "Account created. Redirecting…",
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
      {/* Same cinematic background + account (silver) accent as /login. */}
      <div className="gp-accent-page relative isolate flex min-h-0 flex-1 flex-col overflow-hidden">
        <div aria-hidden className="gp-account-bg" />
        <AppSection
          maxWidth="max-w-md"
          className="flex flex-1 items-center justify-center py-12"
        >
          <div className={APP_AUTH_CARD}>
            <h1 className="text-center text-3xl font-black text-slate-900 dark:text-white gp-home-display">
              Create your{" "}
              <span className="text-[color:var(--page-accent-text)]">
                GamePing AI
              </span>{" "}
              account
            </h1>

            <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
              Save your game preferences and get smart alerts.
            </p>

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
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              autoComplete="new-password"
              className={`mt-4 ${APP_INPUT}`}
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Password: at least 8 characters with one letter and one number.
            </p>

            <button
              type="button"
              onClick={signUp}
              disabled={submitting}
              className={`mt-6 w-full ${APP_PRIMARY_CTA_ACCENT_SM} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
              Already have an account?{" "}
              <Link href="/login" className={APP_INLINE_LINK}>
                Log in
              </Link>
            </p>

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

function SignupFallback() {
  // Navbar + account background only — no loading card/text flash.
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate flex min-h-0 flex-1 flex-col overflow-hidden">
        <div aria-hidden className="gp-account-bg" />
      </div>
    </AppPageShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupForm />
    </Suspense>
  );
}
