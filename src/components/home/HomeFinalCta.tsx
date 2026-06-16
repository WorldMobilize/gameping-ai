"use client";

import Link from "next/link";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import { HomeCtaSectionShell } from "@/components/home/HomeVisualPrimitives";

export default function HomeFinalCta() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  return (
    <HomeCtaSectionShell>
      <div
        className={`gp-home-card gp-home-gradient-shift relative overflow-hidden rounded-[32px] border px-6 py-12 text-center sm:px-12 sm:py-16 ${
          isDark
            ? "gp-home-panel-dark border-violet-500/20 bg-gradient-to-br from-cyan-950/80 via-violet-950/70 to-pink-950/60"
            : "gp-home-panel-light border-white/70 bg-gradient-to-br from-cyan-100/95 via-violet-50/90 to-pink-100/85"
        }`}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${
            isDark
              ? "bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.04),transparent_40%)]"
              : "bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.4),transparent_40%)]"
          }`}
        />

        <div className="relative">
          <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight ${isDark ? "text-slate-50" : "text-slate-900"}`}>
            Stop searching by tags.
            <br />
            Start discovering by taste.
          </h2>
          <p className={`mx-auto mt-5 max-w-lg text-lg leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Tell GamePing what you feel like playing and get games worth your time.
          </p>
          <Link
            href="/recommend"
            className={`mt-10 inline-flex items-center justify-center rounded-full px-10 py-4 text-base font-semibold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${
              isDark
                ? "bg-white text-slate-900 shadow-white/10 hover:bg-slate-100"
                : "bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800"
            }`}
          >
            Try GamePing
          </Link>
        </div>
      </div>
    </HomeCtaSectionShell>
  );
}
