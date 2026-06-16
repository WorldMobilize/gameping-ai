"use client";

import Link from "next/link";
import { useEffect } from "react";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_KICKER,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_PRIMARY_CTA_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-lg" className="flex min-h-[60vh] flex-col justify-center">
        <p className={APP_KICKER}>Something went wrong</p>
        <h1 className={APP_PAGE_TITLE}>GamePing hit a snag</h1>
        <p className={APP_PAGE_LEAD}>
          Sorry — we couldn&apos;t finish loading this page. It&apos;s likely temporary; try
          again or jump back to discovery.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => reset()} className={APP_PRIMARY_CTA_SM}>
            Try again
          </button>
          <Link href="/" className={APP_SECONDARY_CTA}>
            Home
          </Link>
          <Link href="/recommend" className={APP_SECONDARY_CTA}>
            Recommend
          </Link>
          <Link href="/games" className={APP_SECONDARY_CTA}>
            Games
          </Link>
        </div>
      </AppSection>
    </AppPageShell>
  );
}
