"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CALLOUT,
  APP_CARD,
  APP_CARD_LG,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import { COMPANION_VERSION, COMPANION_WINDOWS_URL } from "@/lib/companion/release";
import { supabase } from "@/lib/supabase";

/**
 * Download + overview page for the desktop GamePing Companion. The Windows
 * installer URL and version come from the shared release config
 * (@/lib/companion/release); when the URL is unset the button is disabled
 * instead of being a dead link.
 *
 * The installer is handed to SIGNED-IN users only (free, premium or admin alike).
 * Not a security boundary — the release URL is public — but a UX one: Companion
 * signs in with a GamePing account, so someone who downloads it without one hits
 * a wall at first launch. Anonymous visitors get "create an account" instead.
 * Read-only: it reads the current session, it never writes and never touches auth.
 *
 * This is the OVERVIEW: download, a one-screen picture of what Companion does
 * today, how to start, platform/status, and a FAQ. The full, detailed breakdown
 * (overlay controls, layout, positioning, response types, the desktop dashboard,
 * honest limitations, Companion-vs-site) lives on /companion/about — linked below.
 * Everything here describes what EXISTS in the alpha; no future features promised.
 */
const WINDOWS_DOWNLOAD_URL = COMPANION_WINDOWS_URL;
const APP_VERSION = COMPANION_VERSION;

type Viewer = "loading" | "anon" | "signed-in";

/** What Companion can actually do today — all live in the alpha. */
const WHAT_YOU_CAN_DO: string[] = [
  "Open the overlay in-game with Alt+G — instant show / hide",
  "Ask questions and get text answers — plus video, image, or music when the answer calls for it",
  "Keep the conversation going with follow-up questions in the same session",
  "Resume your last conversation when you reopen the overlay",
  "Use voice input with Alt+M (where supported)",
  "Choose the answer you want: text, video, image, or music",
  "Keep the overlay open while you read a long answer or watch a video",
  "Review recent questions and pinned answers from the desktop app",
  "Sign in with the same GamePing account you use on the site",
];

const HOW_IT_WORKS: { title: string; blurb: string }[] = [
  {
    title: "Download and install",
    blurb: "Grab the Windows app and run the installer.",
  },
  {
    title: "Connect your GamePing account",
    blurb: "Sign in once so Companion is linked to your plan.",
  },
  {
    title: "Press Alt+G in-game and ask",
    blurb: "Summon the overlay over any game and type your question — the answer appears right there.",
  },
];

const PLATFORM_STATUS: { label: string; value: string }[] = [
  { label: "Platform", value: "Windows 10 / 11 (64-bit)" },
  { label: "Status", value: "Alpha · early access" },
  { label: "Account", value: "Same login as GamePing AI" },
  { label: "Backend", value: "Answers run on the GamePing backend — no API keys to set up" },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Which platforms are supported?",
    a: "Windows 10 and 11 (64-bit) only. There's no macOS or Linux build yet — Companion is Windows-first while it's in alpha.",
  },
  {
    q: "Do I need a GamePing account?",
    a: "Yes. Companion signs in with the same account you use on the site, so create one (it's free) and sign in once. Your plan — Free or Premium — carries over automatically.",
  },
  {
    q: "Can it see my screen or detect my game?",
    a: "No. Companion doesn't read your screen, save files, or game memory, and it doesn't auto-detect what you're playing. You ask, and it answers — describing what you see helps when it matters.",
  },
  {
    q: "Does it work in fullscreen games?",
    a: "It works best in windowed or borderless mode. In some exclusive-fullscreen titles the overlay may not appear on top — a known alpha limitation, not a missing promise.",
  },
  {
    q: "Where do my questions and history live?",
    a: "On your PC. Recent questions and pinned answers are stored locally on the device — there's no cloud sync of history across computers.",
  },
  {
    q: "Do I manage tracked games and price alerts here?",
    a: "You can view them in Companion, but you manage them on the GamePing site. Companion is for asking mid-game, not for editing your tracking.",
  },
];

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="mt-14">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
        {label}
      </p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h2>
    </div>
  );
}

export default function CompanionDownloadView() {
  const hasDownload = WINDOWS_DOWNLOAD_URL.length > 0;
  const [viewer, setViewer] = useState<Viewer>("loading");

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setViewer(data.user ? "signed-in" : "anon");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppSection maxWidth="max-w-4xl">
      {/* 1 · Hero */}
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
        Desktop app · Alpha · Windows
      </p>

      <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl gp-home-display">
        GamePing Companion
      </h1>
      <p className="mt-4 text-xl leading-9 text-slate-700 dark:text-slate-300">
        Ask for help while you play — without alt-tab.
      </p>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">
        Companion is the desktop app for GamePing: a lightweight overlay on top of any
        game, plus a desktop app where you manage your account, history, and preferences.
        Press{" "}
        <kbd className="rounded-md border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          Alt+G
        </kbd>{" "}
        while you play, ask, and the answer appears above the game. Same account as the
        site, same AI backend.
      </p>

      {/* Anonymous visitors don't get the installer: Companion needs an account to
          sign into, so handing them the .msi would only strand them at launch. */}
      {viewer === "anon" ? (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/signup" className={APP_PRIMARY_CTA_ACCENT_SM}>
              Create a free account
            </Link>
            <Link href="/login" className={APP_SECONDARY_CTA}>
              Log in
            </Link>
          </div>
          <p className={`mt-4 max-w-2xl ${APP_MUTED}`}>
            Companion signs in with your GamePing account — create one (it&apos;s free) and the
            download for Windows appears right here. Version {APP_VERSION} · Windows 10 &amp; 11 ·
            64-bit.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {hasDownload && viewer === "signed-in" ? (
            <a
              href={WINDOWS_DOWNLOAD_URL}
              className={APP_PRIMARY_CTA_ACCENT_SM}
              download
            >
              Download for Windows
            </a>
          ) : (
            <span
              aria-disabled="true"
              className={`${APP_PRIMARY_CTA_ACCENT_SM} pointer-events-none opacity-50`}
            >
              Download for Windows
            </span>
          )}
          <span className={APP_MUTED}>Version {APP_VERSION} · Windows 10 &amp; 11 · 64-bit</span>
        </div>
      )}

      <div className={`${APP_CALLOUT} mt-6 max-w-2xl`}>
        During a game you don&apos;t want to open a browser, a wiki, or a forum. Companion
        brings GamePing into the session: quick question, answer right there, back to
        playing. The AI runs through the GamePing backend — not inside the desktop app —
        so no API keys to configure.
      </div>

      {/* 2 · What you can do today */}
      <SectionHeading label="What it does" title="What you can do today" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {WHAT_YOU_CAN_DO.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 text-slate-700 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-300"
          >
            <span
              aria-hidden
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--page-accent-strong)]"
            />
            <span className="leading-6">{item}</span>
          </div>
        ))}
      </div>

      {/* 3 · How it works */}
      <SectionHeading label="How it works" title="From install to answer" />
      <ol className="mt-5 space-y-3">
        {HOW_IT_WORKS.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] text-sm font-bold text-[color:var(--page-accent-text)]">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {step.title}
              </p>
              <p className={`mt-0.5 ${APP_MUTED}`}>{step.blurb}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* 4 · Platform & status */}
      <div className={`${APP_CARD_LG} mt-14`}>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          Platform &amp; status
        </p>
        <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {PLATFORM_STATUS.map((row) => (
            <div key={row.label}>
              <dt className="text-sm font-semibold text-slate-900 dark:text-white">
                {row.label}
              </dt>
              <dd className={`mt-0.5 ${APP_MUTED}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 5 · Read more → the detailed page */}
      <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            Want the full picture?
          </p>
          <p className={`mt-1 max-w-xl ${APP_MUTED}`}>
            The overlay controls, layout and positioning, response types, the desktop
            dashboard, and honest alpha limitations — laid out in detail.
          </p>
        </div>
        <Link href="/companion/about" className={`${APP_SECONDARY_CTA} shrink-0`}>
          How Companion works
        </Link>
      </div>

      {/* 6 · FAQ */}
      <SectionHeading label="FAQ" title="Common questions" />
      <div className="mt-5 flex flex-col gap-3">
        {FAQS.map((item) => (
          <details key={item.q} className={`group ${APP_CARD}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white">
              {item.q}
              <svg
                className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <p className={`mt-3 leading-6 ${APP_MUTED}`}>{item.a}</p>
          </details>
        ))}
      </div>
    </AppSection>
  );
}
