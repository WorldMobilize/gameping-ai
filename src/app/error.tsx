"use client";

import Link from "next/link";
import { useEffect } from "react";

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
    <main className="flex min-h-screen flex-col bg-[#05060f] text-white">
      <div className="pointer-events-none absolute left-10 top-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/15 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-lg flex-1 flex-col justify-center px-6 py-20">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
          Something went wrong
        </p>
        <h1 className="mt-4 text-3xl font-black md:text-4xl">
          GamePing hit a snag
        </h1>
        <p className="mt-4 text-sm leading-7 text-white/55">
          Sorry — we couldn&apos;t finish loading this page. It&apos;s likely temporary; try
          again or jump back to discovery.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-8 py-3.5 text-sm font-black text-black shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-8 py-3.5 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 hover:bg-white/10"
          >
            Home
          </Link>
          <Link
            href="/recommend"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-8 py-3.5 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 hover:bg-white/10"
          >
            Recommend
          </Link>
          <Link
            href="/games"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-8 py-3.5 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 hover:bg-white/10"
          >
            Games
          </Link>
        </div>
      </div>
    </main>
  );
}
