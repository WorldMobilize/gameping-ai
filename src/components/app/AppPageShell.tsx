"use client";

import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { APP_SHELL } from "@/components/app/app-styles";

function AppAmbientBlobs() {
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
  className?: string;
  navbarCtaLabel?: string;
  navbarCtaHref?: string;
};

export default function AppPageShell({
  children,
  bare = false,
  className = "",
  navbarCtaLabel,
  navbarCtaHref,
}: AppPageShellProps) {
  return (
    <div className={`${APP_SHELL} ${className}`}>
      {!bare ? (
        <Navbar theme="light" ctaLabel={navbarCtaLabel} ctaHref={navbarCtaHref} />
      ) : null}
      <div className="relative flex flex-1 flex-col">
        <AppAmbientBlobs />
        {children}
      </div>
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
