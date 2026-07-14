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
import { AuthShell, AUTH_INPUT, AUTH_LABEL } from "@/components/auth/auth-ui";
import {
  APP_INLINE_LINK_ACCENT,
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
    <AuthShell
      title="Create your account"
      subtitle="Save your game preferences, track prices, and get smart alerts."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className={APP_INLINE_LINK_ACCENT}>
            Log in
          </Link>
        </>
      }
    >
      <ul className="mb-6 space-y-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {[
          "Save recommendation runs to your dashboard",
          "Track games and get price alerts",
          "Keep your game discovery organized",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--page-accent-text)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12l5 5 9-11" />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="signup-email" className={AUTH_LABEL}>
            Email
          </label>
          <input
            id="signup-email"
            className={AUTH_INPUT}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="signup-password" className={AUTH_LABEL}>
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            className={AUTH_INPUT}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            At least 8 characters with one letter and one number.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={signUp}
        disabled={submitting}
        className={`mt-6 w-full ${APP_PRIMARY_CTA_ACCENT_SM} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {submitting ? "Creating account…" : "Create account"}
      </button>

      <p className="mt-5 text-center">
        <Link href="/upgrade" className={`text-xs ${APP_INLINE_LINK_ACCENT}`}>
          Compare Free vs Premium
        </Link>
      </p>

      <p className="mt-4 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
        By continuing you agree to our{" "}
        <Link href="/terms" className={APP_INLINE_LINK_ACCENT}>Terms</Link>,{" "}
        <Link href="/privacy" className={APP_INLINE_LINK_ACCENT}>Privacy Policy</Link>,{" "}
        <Link href="/cookies" className={APP_INLINE_LINK_ACCENT}>Cookie Policy</Link>, and{" "}
        <Link href="/disclaimer" className={APP_INLINE_LINK_ACCENT}>Disclaimer</Link>.
      </p>
    </AuthShell>
  );
}

function SignupFallback() {
  return (
    <AuthShell title="Create your account" subtitle="Save your game preferences and get smart alerts.">
      <div className="flex flex-col gap-4">
        <div className="h-[70px] rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
        <div className="h-[70px] rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
        <div className="mt-2 h-[46px] rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
      </div>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupForm />
    </Suspense>
  );
}
