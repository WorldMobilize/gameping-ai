"use client";

import { AppSection } from "@/components/app/AppPageShell";
import {
  APP_CALLOUT,
  APP_CARD,
  APP_CARD_LG,
  APP_MUTED,
  APP_PRIMARY_CTA_ACCENT_SM,
} from "@/components/app/app-styles";

/**
 * Admin-only download + product page for the desktop GamePing Companion (Alpha).
 * Renders inside AdminOnlyPageGate, so it never reaches non-admins. Pure UI —
 * the Windows installer URL comes from NEXT_PUBLIC_COMPANION_WINDOWS_URL; when
 * unset the button is disabled with a "coming soon" label instead of a dead link.
 */
const WINDOWS_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_COMPANION_WINDOWS_URL?.trim() || "";

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
    title: "Press Alt+G in-game",
    blurb: "Summon the overlay on top of whatever you’re playing.",
  },
  {
    title: "Ask anything",
    blurb: "Type your question — no alt-tabbing, no browser tabs.",
  },
  {
    title: "Get the answer above your game",
    blurb: "The answer appears in the overlay, right where you need it.",
  },
];

const WHY_IT_MATTERS: { title: string; blurb: string }[] = [
  {
    title: "No alt-tab",
    blurb: "Stay in the game — the answer comes to you.",
  },
  {
    title: "No ten browser tabs",
    blurb: "Skip the wiki-and-forum scavenger hunt.",
  },
  {
    title: "Same GamePing account",
    blurb: "One login across the site and the desktop app.",
  },
  {
    title: "Same plan & account system",
    blurb: "Nothing new to manage — it uses your existing plan.",
  },
  {
    title: "Built for richer answers",
    blurb: "Designed for future video, map, and image answers.",
  },
];

const ALPHA_NOTES = [
  "Admin-only for now",
  "Early test build",
  "Windows first",
  "Runs on the online GamePing backend",
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

  return (
    <AppSection maxWidth="max-w-4xl">
      {/* 1 · Hero */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          Experimental · Admin only
        </p>
        <span className="inline-flex items-center rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--page-accent-text)]">
          Alpha
        </span>
      </div>

      <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl gp-home-display">
        GamePing Companion
      </h1>
      <p className="mt-4 text-xl leading-9 text-slate-700 dark:text-slate-300">
        Ask for help without leaving your game.
      </p>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">
        GamePing Companion is a desktop app for Windows. Press{" "}
        <kbd className="rounded-md border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          Alt+G
        </kbd>{" "}
        while you play, ask a question, and get an answer on top of your game —
        without alt-tabbing.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {hasDownload ? (
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
            Download coming soon
          </span>
        )}
        <span className={APP_MUTED}>Windows 10 &amp; 11 · 64-bit</span>
      </div>

      <div className={`${APP_CALLOUT} mt-6 max-w-2xl`}>
        The AI runs through the GamePing website backend — not inside the desktop
        app — so your OpenAI keys stay server-side. Companion connects to your
        GamePing account and, for now, is admin-only.
      </div>

      {/* 2 · How it works */}
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

      {/* 3 · Why it matters */}
      <SectionHeading label="Why it matters" title="Help that stays in the game" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {WHY_IT_MATTERS.map((item) => (
          <div key={item.title} className={APP_CARD}>
            <p className="font-semibold text-slate-900 dark:text-white">
              {item.title}
            </p>
            <p className={`mt-1 ${APP_MUTED}`}>{item.blurb}</p>
          </div>
        ))}
      </div>
      <p className={`mt-4 max-w-2xl ${APP_MUTED}`}>
        Today Companion answers with text. In the future it can also show videos,
        maps, images, wiki cards, builds, and checklists.
      </p>

      {/* 4 · Alpha note */}
      <div className={`${APP_CARD_LG} mt-14`}>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          Alpha note
        </p>
        <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {ALPHA_NOTES.map((note) => (
            <li
              key={note}
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--page-accent-strong)]"
              />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </AppSection>
  );
}
