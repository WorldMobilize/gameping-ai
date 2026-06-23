"use client";

import { useState } from "react";
import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_ACCENT,
  APP_AUTH_CARD,
  APP_INLINE_LINK,
  APP_INPUT,
  APP_PRIMARY_CTA_SM,
} from "@/components/app/app-styles";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSent(false);

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppPageShell>
      <AppSection
        maxWidth="max-w-md"
        className="flex flex-1 items-center justify-center py-12"
      >
        <div className={APP_AUTH_CARD}>
          <h1 className="text-center text-3xl font-black text-slate-900 dark:text-white gp-home-display">
            Reset <span className={APP_ACCENT}>password</span>
          </h1>

          <p className="mt-3 text-center text-sm text-slate-700 dark:text-slate-300">
            Enter the email for your GamePing account. We will send a reset link if it matches an
            account.
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <label htmlFor="reset-email" className="sr-only">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              className={APP_INPUT}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            {errorMessage ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            ) : null}

            {sent ? (
              <p className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                If an account exists, we sent you a password reset link.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className={`mt-6 ${APP_PRIMARY_CTA_SM} w-full disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            <Link href="/login" className={APP_INLINE_LINK}>
              ← Back to login
            </Link>
          </p>
        </div>
      </AppSection>
    </AppPageShell>
  );
}
