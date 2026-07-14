"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, AUTH_INPUT, AUTH_LABEL } from "@/components/auth/auth-ui";
import {
  APP_INLINE_LINK_ACCENT,
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
    }, 12000);

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
    return (
      <AuthShell title="Verifying your link" subtitle="One moment while we confirm your reset link…">
        <div className="flex flex-col gap-4">
          <div className="h-[46px] rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
          <div className="h-[46px] rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
        </div>
      </AuthShell>
    );
  }

  if (phase === "invalid") {
    return (
      <AuthShell
        title="Link invalid"
        subtitle="This reset link is invalid or expired. Request a new one to continue."
        footer={
          <Link href="/login" className={APP_INLINE_LINK_ACCENT}>
            ← Back to login
          </Link>
        }
      >
        <Link href="/reset-password" className={`inline-flex w-full ${APP_PRIMARY_CTA_ACCENT_SM}`}>
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a new password for your account — at least 8 characters."
      footer={
        <Link href="/login" className={APP_INLINE_LINK_ACCENT}>
          ← Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="new-password" className={AUTH_LABEL}>
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            className={AUTH_INPUT}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className={AUTH_LABEL}>
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            className={AUTH_INPUT}
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {clientError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {clientError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={`mt-2 w-full ${APP_PRIMARY_CTA_ACCENT_SM} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
