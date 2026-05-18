"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isEmailVerified } from "@/lib/auth-email-verification";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

type EmailVerificationNoticeProps = {
  className?: string;
  compact?: boolean;
};

export default function EmailVerificationNotice({
  className = "",
  compact = false,
}: EmailVerificationNoticeProps) {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setUser(data.user ?? null);
    };

    void load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const resend = useCallback(async () => {
    setResending(true);
    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        showToast({
          variant: "error",
          message:
            typeof body.message === "string" && body.message.length > 0
              ? body.message
              : "Could not resend verification email.",
        });
        return;
      }

      showToast({
        variant: "success",
        message:
          typeof body.message === "string"
            ? body.message
            : "Verification email sent.",
      });
    } catch {
      showToast({
        variant: "error",
        message: "Could not resend verification email.",
      });
    } finally {
      setResending(false);
    }
  }, [showToast]);

  if (!user || isEmailVerified(user)) {
    return null;
  }

  if (compact) {
    return (
      <p
        className={`rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100/95 ${className}`}
      >
        Verify your email to unlock recommendations, saved runs, tracking, and Premium.{" "}
        <button
          type="button"
          disabled={resending}
          onClick={() => void resend()}
          className="font-bold text-cyan-200 underline-offset-2 hover:underline disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend verification email"}
        </button>
      </p>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 ${className}`}
      role="status"
    >
      <p className="text-sm font-bold text-amber-100">Verify your email</p>
      <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
        Please verify your email to unlock recommendations, saved runs, game tracking, and
        Premium. We sent a link to{" "}
        <span className="font-semibold text-white">{user.email ?? "your inbox"}</span>.
      </p>
      <button
        type="button"
        disabled={resending}
        onClick={() => void resend()}
        className="mt-3 rounded-full border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-sm font-bold text-amber-50 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {resending ? "Sending…" : "Resend verification email"}
      </button>
    </div>
  );
}
