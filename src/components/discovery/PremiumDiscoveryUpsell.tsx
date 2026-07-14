import Link from "next/link";
import { APP_PAGE_LEAD, APP_PAGE_TITLE, APP_SECONDARY_CTA } from "@/components/app/app-styles";

// Panel + accents follow the CURRENT page accent (--page-accent-*: orange on
// /weekly-picks, pink on /deals-for-you, aqua on /monthly-recap) instead of a
// fixed cyan/violet, so the locked/preview state matches each page's identity.
const ACCENT_PANEL =
  "rounded-3xl border border-[color:var(--page-accent-border)] bg-gradient-to-br from-[var(--page-accent-soft)] via-white to-[var(--page-accent-soft)] p-6 shadow-sm dark:via-slate-900/70";
const ACCENT_PRIMARY_CTA =
  "gp-page-cta inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--page-accent-border)]";

export default function PremiumDiscoveryUpsell({
  /** Anonymous viewers get a login/signup CTA instead of "try a recommendation". */
  showLogin = false,
}: {
  showLogin?: boolean;
} = {}) {
  return (
    <div className={`${ACCENT_PANEL} mt-10 p-8 sm:p-10`}>
      <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[color:var(--page-accent-text)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--page-accent-strong)]" aria-hidden />
        Demo
      </span>
      <h1 className={`${APP_PAGE_TITLE} mt-4 text-3xl sm:text-4xl`}>
        You&apos;re viewing a <span className="text-[color:var(--page-accent-text)]">demo</span>
      </h1>
      <p className={`${APP_PAGE_LEAD} max-w-2xl`}>
        Everything on this page is example data — a preview of how it works, not your library.
        With Premium, Weekly Picks, Deals For You, and Monthly Recap are built from your real
        taste: your Steam library, saved searches, and tracked games.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/upgrade" className={ACCENT_PRIMARY_CTA}>
          Upgrade to Premium
        </Link>
        {showLogin ? (
          <Link href="/login" className={APP_SECONDARY_CTA}>
            Log in or sign up
          </Link>
        ) : (
          <Link href="/recommend" className={APP_SECONDARY_CTA}>
            Try a free recommendation
          </Link>
        )}
      </div>
    </div>
  );
}
