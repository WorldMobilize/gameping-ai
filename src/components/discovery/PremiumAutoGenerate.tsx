"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { APP_CARD, APP_MUTED, APP_PRIMARY_CTA_ACCENT_SM, APP_SECONDARY_CTA } from "@/components/app/app-styles";
import type { PremiumRotationType } from "@/lib/discovery/user-rotation-store";

/**
 * Premium generation island. The page renders instantly from cache; when there's
 * no cached rotation yet (but the user has signal), the page mounts this. It
 * triggers /api/premium/generate-mine OFF the page render, shows a "Generating"
 * state, and refreshes the route when content is ready — so the page itself never
 * blocks on the slow RAWG/pricing/OpenAI work.
 */

type Phase = "working" | "insufficient" | "error";

export default function PremiumAutoGenerate({
  type,
  noun,
}: {
  type: PremiumRotationType;
  /** e.g. "weekly picks", "deals", "recap" — used in copy. */
  noun: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("working");
  const [, startTransition] = useTransition();
  const firedRef = useRef(false);

  async function generate() {
    setPhase("working");
    try {
      const res = await fetch("/api/premium/generate-mine", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        hasContent?: boolean;
        insufficient?: boolean;
      };
      if (res.ok && json.hasContent) {
        startTransition(() => router.refresh());
        return;
      }
      setPhase(json.insufficient ? "insufficient" : "error");
    } catch {
      setPhase("error");
    }
  }

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "working") {
    return (
      <div className="mt-8" aria-live="polite" aria-busy>
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 animate-spin text-[color:var(--page-accent-text)] motion-reduce:animate-none"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M14 8a6 6 0 1 1-1.7-4.2" />
          </svg>
          <p className="text-sm font-semibold text-white">
            Generating your {noun} from your taste profile…
          </p>
        </div>
        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="h-44 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04] motion-reduce:animate-none"
            />
          ))}
        </ul>
        <p className={`mt-4 text-xs ${APP_MUTED}`}>
          This runs once, then your {noun} are cached for fast loads.
        </p>
      </div>
    );
  }

  // insufficient / error → graceful state with a manual retry.
  return (
    <section className={`mt-8 ${APP_CARD} p-6`}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        {phase === "insufficient"
          ? `Not enough signal yet for credible ${noun}`
          : `Couldn't build your ${noun} right now`}
      </h2>
      <p className={`mt-2 max-w-2xl text-sm leading-6 ${APP_MUTED}`}>
        {phase === "insufficient"
          ? "We only recommend real, credible games — and we don't have enough of your taste yet to find them. Import your Steam library, save a search, or track a few games, then try again."
          : "Something went wrong while generating. Please try again in a moment."}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => void generate()} className={APP_PRIMARY_CTA_ACCENT_SM}>
          Try again
        </button>
        {phase === "insufficient" ? (
          <>
            <Link href="/settings/account#steam-library-import" className={APP_SECONDARY_CTA}>
              Import Steam library
            </Link>
            <Link href="/recommend" className={APP_SECONDARY_CTA}>
              Save a search
            </Link>
          </>
        ) : null}
      </div>
    </section>
  );
}
