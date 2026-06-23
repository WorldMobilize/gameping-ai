"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_AUTH_CARD,
  APP_INLINE_LINK,
  APP_INPUT,
  APP_PRIMARY_CTA_ACCENT_SM,
} from "@/components/app/app-styles";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

function readRecoveryHint(): boolean {
  if (typeof window === "undefined") return false;
  const { hash, search } = window.location;
  return (
    hash.includes("type=recovery") ||
    new URLSearchParams(search).get("type") === "recovery"
  );
}

type Phase = "checking" | "invalid" | "ready";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("checking");
  const [clientError, setClientError] = useState<string | null>(null);
  const recoveryHintRef = useRef(false);
  const phaseRef = useRef<Phase>("checking");

  const goReady = useCallback(() => {
    phaseRef.current = "ready";
    setPhase("ready");
  }, []);

  useEffect(() => {
    phaseRef.current = "checking";
    recoveryHintRef.current = readRecoveryHint();

    let cancelled = false;
    const code = new URLSearchParams(window.location.search).get("code");

    const tryExchange = async () => {
      if (!code) return;
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;
      if (!error) goReady();
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY") {
        goReady();
      }
    });

    void tryExchange();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session && recoveryHintRef.current) {
        goReady();
      }
    });

    const t = window.setTimeout(() => {
      if (cancelled) return;
      if (phaseRef.current !== "ready") {
        phaseRef.current = "invalid";
        setPhase("invalid");
      }
    }, 4000);

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, [goReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (password.length < 8) {
      setClientError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setClientError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        showToast({ variant: "error", message: error.message });
        return;
      }

      showToast({
        variant: "success",
        message: "Your password was updated. Redirecting…",
      });

      window.setTimeout(() => {
        router.push("/dashboard");
      }, 1400);
    } finally {
      setLoading(false);
    }
  };

  if (phase === "checking") {
    // Navbar + account background only — no loading card flash while we verify.
    return (
      <AppPageShell hideAmbient>
        <div className="gp-accent-page relative isolate flex min-h-0 flex-1 flex-col overflow-hidden">
          <div aria-hidden className="gp-account-bg" />
        </div>
      </AppPageShell>
    );
  }

  if (phase === "invalid") {
    return (
      <AppPageShell hideAmbient>
        <div className="gp-accent-page relative isolate flex min-h-0 flex-1 flex-col overflow-hidden">
          <div aria-hidden className="gp-account-bg" />
          <AppSection
            maxWidth="max-w-md"
            className="flex flex-1 items-center justify-center py-12"
          >
            <div className={`${APP_AUTH_CARD} text-center`}>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white gp-home-display">
                Link <span className="text-[color:var(--page-accent-text)]">invalid</span>
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                This reset link is invalid or expired. Please request a new one.
              </p>
              <Link
                href="/reset-password"
                className={`mt-8 inline-flex ${APP_PRIMARY_CTA_ACCENT_SM}`}
              >
                Request new link
              </Link>
              <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
                <Link href="/login" className={APP_INLINE_LINK}>
                  Back to login
                </Link>
              </p>
            </div>
          </AppSection>
        </div>
      </AppPageShell>
    );
  }

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
              New <span className="text-[color:var(--page-accent-text)]">password</span>
            </h1>

          <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
            Choose a new password for your account (at least 8 characters).
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <label htmlFor="new-password" className="sr-only">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className={APP_INPUT}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <label htmlFor="confirm-password" className="sr-only">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className={`mt-4 ${APP_INPUT}`}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />

            {clientError ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {clientError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className={`mt-6 ${APP_PRIMARY_CTA_ACCENT_SM} w-full disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            <Link href="/login" className={APP_INLINE_LINK}>
              Back to login
            </Link>
          </p>
        </div>
        </AppSection>
      </div>
    </AppPageShell>
  );
}
