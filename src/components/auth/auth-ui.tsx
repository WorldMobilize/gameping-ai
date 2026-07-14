"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared auth chrome — premium, calm, consistent with the landing.
 *
 * A centered card on the clean holographic base with a minimal brand header
 * (no full navbar) and one soft accent glow. Presentation only: pages keep all
 * of their own form state, handlers, and Supabase logic and simply render it as
 * children. Title/subtitle are standardized props; anything custom goes in
 * children. The accent follows the per-route --page-accent (silver on account
 * pages), so auth stays coherent with /dashboard and /settings.
 */

type AuthShellProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Rendered below the card (e.g. "New here? Create an account"). */
  footer?: ReactNode;
  /** Hide the top-right "Back to site" link (e.g. disposable verify tab). */
  showBack?: boolean;
};

export function AuthShell({ title, subtitle, children, footer, showBack = true }: AuthShellProps) {
  return (
    <div
      className="gp-accent-page relative flex min-h-screen flex-col overflow-hidden"
      style={{ backgroundColor: "var(--gp-bg-base)" }}
    >
      <div aria-hidden className="gp-account-bg" />
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-[-14%] h-[420px] w-[660px] -translate-x-1/2 rounded-full bg-[var(--page-accent-soft)] blur-[130px]"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-8">
        <Link
          href="/"
          className="text-base font-black tracking-tight text-slate-900 no-underline dark:text-white"
        >
          GamePing <span className="text-[color:var(--page-accent-text)]">AI</span>
        </Link>
        {showBack ? (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 no-underline transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to site
          </Link>
        ) : null}
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-16 pt-2 sm:pt-4">
        <div className="w-full max-w-md">
          {title ? (
            <div className="mb-7 text-center">
              <h1 className="gp-home-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[1.85rem]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {subtitle}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_24px_64px_-28px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-[0_28px_72px_-30px_rgba(0,0,0,0.72)] sm:p-8">
            {children}
          </div>

          {footer ? (
            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

/** Premium field input — accent-aware focus ring, theme-aware surfaces. */
export const AUTH_INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--page-accent-border)] focus:ring-4 focus:ring-[var(--page-accent-soft)] dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-slate-500";

/** Uppercase field label. */
export const AUTH_LABEL =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400";

/** Muted helper/hint text. */
export const AUTH_HINT = "text-xs leading-5 text-slate-500 dark:text-slate-400";
