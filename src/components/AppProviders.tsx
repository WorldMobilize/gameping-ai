"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { HomeThemeProvider } from "@/components/home/HomeThemeProvider";
import PageAccentProvider from "@/components/PageAccentProvider";
import { ToastProvider } from "@/components/ToastProvider";
import ProductAnalyticsProvider from "@/components/ProductAnalyticsProvider";

/**
 * The Suspense boundary holds the two side-effect components and NOTHING else.
 *
 * `children` used to sit inside it, under ProductAnalyticsProvider. That
 * provider calls useSearchParams(), which cannot be resolved while prerendering,
 * so React bailed the whole boundary to client-side rendering — and because the
 * boundary contained the entire app, the static HTML of every page became
 * `fallback={null}`. 69 of 70 prerendered pages shipped metadata and an empty
 * body, the ~280 game URLs included.
 *
 * The provider never needed to wrap anything: it holds no context, it runs
 * effects and ends with `return children`. Rendered as a sibling, the bailout
 * stays where it belongs — on the analytics, which is client-only anyway — and
 * the pages prerender.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <HomeThemeProvider>
      <ToastProvider>
        <Suspense fallback={null}>
          <PageAccentProvider />
          <ProductAnalyticsProvider />
        </Suspense>
        {children}
      </ToastProvider>
    </HomeThemeProvider>
  );
}
