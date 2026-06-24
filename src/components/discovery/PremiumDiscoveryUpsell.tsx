import Link from "next/link";
import {
  APP_ACCENT,
  APP_CTA_PANEL,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_PRIMARY_CTA_LG,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";

export default function PremiumDiscoveryUpsell({
  /** Anonymous viewers get a login/signup CTA instead of "try a recommendation". */
  showLogin = false,
}: {
  showLogin?: boolean;
} = {}) {
  return (
    <div className={`${APP_CTA_PANEL} mt-10 p-8 sm:p-10`}>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700 dark:text-violet-400">
        Premium discovery
      </p>
      <h1 className={`${APP_PAGE_TITLE} mt-4 text-3xl sm:text-4xl`}>
        Premium <span className={APP_ACCENT}>discovery</span>
      </h1>
      <p className={`${APP_PAGE_LEAD} max-w-2xl`}>
        Weekly Picks, Deals For You, and Monthly Recap are Premium discovery areas. Upgrade to
        unlock personalized game picks, deal-focused recommendations, and your monthly gaming recap —
        built from your Steam library, saved searches, and tracked games.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/upgrade" className={APP_PRIMARY_CTA_LG}>
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
