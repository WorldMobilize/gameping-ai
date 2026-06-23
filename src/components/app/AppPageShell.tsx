"use client";

import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import { APP_SHELL } from "@/components/app/app-styles";

function AppAmbientBlobs({ isDark }: { isDark: boolean }) {
  if (isDark) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-violet-500/8 blur-3xl" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-200/25 blur-3xl" />
      <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-violet-200/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-100/30 blur-3xl" />
    </div>
  );
}

type AppPageShellProps = {
  children: ReactNode;
  /** When true, omit Navbar (e.g. verify-success). */
  bare?: boolean;
  /** When true, skip default ambient blobs (page supplies its own background). */
  hideAmbient?: boolean;
  className?: string;
  navbarCtaLabel?: string;
  navbarCtaHref?: string;
};

export default function AppPageShell({
  children,
  bare = false,
  hideAmbient = false,
  className = "",
  navbarCtaLabel,
  navbarCtaHref,
}: AppPageShellProps) {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";

  return (
    <div className={`${APP_SHELL} ${className}`}>
      {!bare ? (
        <Navbar ctaLabel={navbarCtaLabel} ctaHref={navbarCtaHref} />
      ) : null}
      <main className="relative flex flex-1 flex-col">
        {!hideAmbient ? <AppAmbientBlobs isDark={isDark} /> : null}
        {children}
      </main>
    </div>
  );
}

type AppSectionProps = {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
};

export function AppSection({
  children,
  className = "",
  maxWidth = "max-w-4xl",
}: AppSectionProps) {
  return (
    <section className={`relative z-10 px-6 py-16 md:py-20 ${className}`}>
      <div className={`mx-auto ${maxWidth}`}>{children}</div>
    </section>
  );
}
