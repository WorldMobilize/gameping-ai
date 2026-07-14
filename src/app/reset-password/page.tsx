"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell, AUTH_INPUT, AUTH_LABEL } from "@/components/auth/auth-ui";
import {
  APP_INLINE_LINK_ACCENT,
  APP_PRIMARY_CTA_ACCENT_SM,
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
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email for your GamePing account. We'll send a reset link if it matches one."
      footer={
        <Link href="/login" className={APP_INLINE_LINK_ACCENT}>
          ← Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor="reset-email" className={AUTH_LABEL}>
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          className={AUTH_INPUT}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        {errorMessage ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {sent ? (
          <p className="mt-4 rounded-xl border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-3 text-sm text-[color:var(--page-accent-text)]">
            If an account exists, we sent you a password reset link.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={`mt-6 w-full ${APP_PRIMARY_CTA_ACCENT_SM} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
