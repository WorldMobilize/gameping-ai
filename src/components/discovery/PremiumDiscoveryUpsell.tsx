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
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]">
        Premium discovery
      </p>
      <h1 className={`${APP_PAGE_TITLE} mt-4 text-3xl sm:text-4xl`}>
        Premium <span className="text-[color:var(--page-accent-text)]">discovery</span>
      </h1>
      <p className={`${APP_PAGE_LEAD} max-w-2xl`}>
        Weekly Picks, Deals For You, and Monthly Recap are Premium discovery areas. Upgrade to
        unlock personalized game picks, deal-focused recommendations, and your monthly gaming recap —
        built from your Steam library, saved searches, and tracked games.
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
