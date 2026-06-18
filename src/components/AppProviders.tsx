"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { HomeThemeProvider } from "@/components/home/HomeThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import ProductAnalyticsProvider from "@/components/ProductAnalyticsProvider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <HomeThemeProvider>
      <ToastProvider>
        <Suspense fallback={null}>
          <ProductAnalyticsProvider>{children}</ProductAnalyticsProvider>
        </Suspense>
      </ToastProvider>
    </HomeThemeProvider>
  );
}
