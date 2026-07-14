import Link from "next/link";
import { AppSection } from "@/components/app/AppPageShell";

/**
 * Placeholder shown on every World Mobilize route while the product is not ready.
 *
 * World Mobilize is intentionally locked pre-launch: we don't want visitors (or
 * search engines) to reach half-built territory/claim features. The real views
 * still exist in the codebase — the routes just render this until launch, and
 * every World Mobilize page is noindex. Presentation only; no data, no logic.
 */
function LockIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export default function WorldMobilizeComingSoon() {
  return (
    <AppSection maxWidth="max-w-3xl">
      <div className="flex min-h-[62vh] flex-col items-center justify-center py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] text-white/80">
          <LockIcon />
        </span>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-strong)]">
          World Mobilize
        </p>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
          Coming soon
        </h1>

        <p className="mt-6 max-w-md text-lg leading-8 text-slate-200">
          Something new is coming. It isn&apos;t ready yet — check back soon.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/discover"
            className="inline-flex items-center justify-center rounded-full bg-blue-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Explore Discovery
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-white/35 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
          >
            Back to home
          </Link>
        </div>
      </div>
    </AppSection>
  );
}
