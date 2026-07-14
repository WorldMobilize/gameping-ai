"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/auth-ui";
import {
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import { POST_VERIFICATION_REDIRECT } from "@/lib/auth-redirects";

/** This disposable tab quietly sends itself home if left open. */
const AUTO_REDIRECT_MS = 10_000;

function SuccessCheckIcon() {
  return (
    <svg
      className="h-7 w-7 text-[color:var(--page-accent-text)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" className="opacity-20" stroke="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5l2.2 2.2 4.8-5" />
    </svg>
  );
}

export default function VerifySuccessPage() {
  const router = useRouter();
  // null = unknown yet; true/false once the session check resolves. Cross-device
  // verification lands here WITHOUT a session, so we adapt the copy accordingly.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [closeBlocked, setCloseBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSignedIn(Boolean(data.session));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // This tab is disposable: if the user leaves it open, send it home so it never
  // sits as a dead-end. We do NOT touch or focus the original tab.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace(POST_VERIFICATION_REDIRECT);
    }, AUTO_REDIRECT_MS);
    return () => window.clearTimeout(timer);
  }, [router]);

  const handleClose = useCallback(() => {
    // Browsers only allow window.close() on script-opened tabs; a tab opened from
    // an email link usually can't be closed programmatically. Attempt it, then
    // surface a graceful fallback message if we're still here.
    window.close();
    window.setTimeout(() => setCloseBlocked(true), 300);
  }, []);

  return (
    <AuthShell showBack={false}>
      <div className="text-center" role="status">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] shadow-sm"
          aria-hidden
        >
          <SuccessCheckIcon />
        </div>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.32em] text-[color:var(--page-accent-text)]">
          GamePing AI
        </p>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white gp-home-display">
          Email verified
        </h1>

        <p className="mx-auto mt-4 max-w-[20rem] text-pretty text-sm leading-6 text-slate-600 dark:text-slate-300">
          {signedIn === false
            ? "Your email is verified. Log in to continue."
            : "Your GamePing account is ready. You can safely close this tab and return to GamePing."}
        </p>

        <div className="mt-7 flex flex-col items-center gap-3">
          <Link href="/" className={`w-full ${APP_PRIMARY_CTA_ACCENT_SM}`}>
            Go to GamePing
          </Link>
          <button type="button" onClick={handleClose} className={`w-full ${APP_SECONDARY_CTA}`}>
            Close this tab
          </button>
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-500 dark:text-slate-400">
          If you leave this tab open, it returns to GamePing automatically.
        </p>

        {closeBlocked ? (
          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Your browser blocked automatic closing. You can safely close this tab.
          </p>
        ) : null}
      </div>
    </AuthShell>
  );
}
