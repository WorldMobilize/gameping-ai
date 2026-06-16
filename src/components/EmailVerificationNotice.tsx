"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isEmailVerified } from "@/lib/auth-email-verification";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

type EmailVerificationNoticeProps = {
  className?: string;
  compact?: boolean;
  theme?: "dark" | "light";
};

export default function EmailVerificationNotice({
  className = "",
  compact = false,
  theme = "dark",
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

  const isLight = theme === "light";

  if (compact) {
    return (
      <p
        className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
          isLight
            ? "border-amber-200/90 bg-amber-50 text-amber-950"
            : "border-amber-400/30 bg-amber-500/10 text-amber-100/95"
        } ${className}`}
      >
        Verify your email to unlock recommendations, saved runs, tracking, and Premium.{" "}
        <button
          type="button"
          disabled={resending}
          onClick={() => void resend()}
          className={`font-bold underline-offset-2 hover:underline disabled:opacity-50 ${
            isLight ? "text-cyan-700" : "text-cyan-200"
          }`}
        >
          {resending ? "Sending…" : "Resend verification email"}
        </button>
      </p>
    );
  }

  return (
    <div
      className={`rounded-2xl border px-5 py-4 ${
        isLight
          ? "border-amber-200/90 bg-amber-50"
          : "border-amber-400/30 bg-amber-500/10"
      } ${className}`}
      role="status"
    >
      <p className={`text-sm font-bold ${isLight ? "text-amber-950" : "text-amber-100"}`}>
        Verify your email
      </p>
      <p
        className={`mt-2 text-sm leading-relaxed ${
          isLight ? "text-amber-900/90" : "text-amber-100/90"
        }`}
      >
        Please verify your email to unlock recommendations, saved runs, game tracking, and
        Premium. We sent a link to{" "}
        <span className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
          {user.email ?? "your inbox"}
        </span>
        .
      </p>
      <button
        type="button"
        disabled={resending}
        onClick={() => void resend()}
        className={`mt-3 rounded-full border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          isLight
            ? "border-amber-300/80 bg-white text-amber-950 hover:bg-amber-100/80"
            : "border-amber-400/40 bg-amber-500/15 text-amber-50 hover:bg-amber-500/25"
        }`}
      >
        {resending ? "Sending…" : "Resend verification email"}
      </button>
    </div>
  );
}
