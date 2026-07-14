"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/auth-ui";
import {
  APP_INLINE_LINK_ACCENT,
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import { useToast } from "@/components/ToastProvider";
import {
  getEmailVerificationRedirectUrl,
  PENDING_VERIFICATION_EMAIL_KEY,
  POST_VERIFICATION_REDIRECT,
} from "@/lib/auth-redirects";

const RESEND_COOLDOWN_SECONDS = 60;

/** Read the just-signed-up email from sessionStorage via an external store, so
 *  there is no setState-in-effect and no SSR/hydration mismatch. */
function subscribePendingEmail(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readPendingEmail(): string | null {
  try {
    const stored = window.sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
    return stored && stored.trim() ? stored.trim() : null;
  } catch {
    return null;
  }
}

function clearPendingEmail() {
  try {
    window.sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
  } catch {}
}

function EnvelopeIcon() {
  return (
    <svg
      className="h-7 w-7 text-[color:var(--page-accent-text)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2.5" className="opacity-30" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7l8 6 8-6" />
    </svg>
  );
}

export default function CheckEmailPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const email = useSyncExternalStore(
    subscribePendingEmail,
    readPendingEmail,
    () => null
  );
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // If verification happens in this same browser, advance off the waiting page.
  useEffect(() => {
    let cancelled = false;

    const goHomeIfAuthed = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled && session) {
        clearPendingEmail();
        router.replace(POST_VERIFICATION_REDIRECT);
      }
    };

    void goHomeIfAuthed();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        clearPendingEmail();
        router.replace(POST_VERIFICATION_REDIRECT);
      }
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") void goHomeIfAuthed();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resend = useCallback(async () => {
    if (!email || sending || cooldown > 0) return;
    setSending(true);
    try {
      const emailRedirectTo = getEmailVerificationRedirectUrl(
        window.location.origin
      );
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo },
      });
      if (error) {
        showToast({ variant: "error", message: error.message });
        return;
      }
      showToast({
        variant: "success",
        message: "Verification email sent. Check your inbox and spam folder.",
      });
      startCooldown();
    } catch {
      showToast({
        variant: "error",
        message: "Could not send verification email. Please try again.",
      });
    } finally {
      setSending(false);
    }
  }, [email, sending, cooldown, showToast, startCooldown]);

  const resendLabel = sending
    ? "Sending…"
    : cooldown > 0
      ? `Resend in ${cooldown}s`
      : "Resend verification email";

  return (
    <AuthShell showBack={false}>
      <div className="text-center" role="status">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] shadow-sm"
          aria-hidden
        >
          <EnvelopeIcon />
        </div>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.32em] text-[color:var(--page-accent-text)]">
          GamePing AI
        </p>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white gp-home-display">
          Check your email
        </h1>

        <p className="mx-auto mt-3 max-w-[20rem] text-pretty text-sm leading-6 text-slate-600 dark:text-slate-400">
          We sent a verification link to
        </p>

        {email ? (
          <div className="mx-auto mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-1.5">
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {email}
            </span>
          </div>
        ) : (
          <p className="mx-auto mt-3 text-sm font-semibold text-slate-900 dark:text-white">
            your email address
          </p>
        )}

        <p className="mx-auto mt-4 max-w-[20rem] text-pretty text-sm leading-6 text-slate-600 dark:text-slate-300">
          Open the link to activate your GamePing account.
        </p>

        <div className="mt-7 flex flex-col items-center gap-3">
          {email ? (
            <button
              type="button"
              onClick={resend}
              disabled={sending || cooldown > 0}
              className={`w-full ${APP_PRIMARY_CTA_ACCENT_SM} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {resendLabel}
            </button>
          ) : null}

          <Link href="/signup" onClick={clearPendingEmail} className={`w-full ${APP_SECONDARY_CTA}`}>
            {email ? "Use another email" : "Back to signup"}
          </Link>
        </div>

        <div className="mt-7 border-t border-slate-200/70 pt-5 dark:border-white/10">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            Check Spam or Promotions if you don&apos;t see it. Still nothing?{" "}
            <Link href="/contact" className={APP_INLINE_LINK_ACCENT}>
              Contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
