"use client";

import Link from "next/link";
import {
  APP_PRIMARY_CTA_SM,
  APP_SECONDARY_CTA,
} from "@/components/app/app-styles";
import {
  getLimitReachedDisplay,
  type LimitType,
} from "@/lib/product-copy";

type Props = {
  limitType: LimitType;
  plan: string | null | undefined;
  anonymous?: boolean;
  className?: string;
};

export default function PlanLimitReached({
  limitType,
  plan,
  anonymous,
  className = "",
}: Props) {
  const display = getLimitReachedDisplay({ limitType, plan, anonymous });

  return (
    <div
      className={`rounded-2xl border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] p-5 shadow-sm ${className}`}
      role="status"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--page-accent-text)]">
        {display.title}
      </p>
      <p className="mt-2.5 text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
        {display.body}
      </p>
      {display.footer ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{display.footer}</p>
      ) : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {display.showSignupCta ? (
          <Link href={display.signupHref} className={APP_PRIMARY_CTA_SM}>
            {display.signupLabel}
          </Link>
        ) : null}
        {display.showUpgradeCta ? (
          <Link href="/upgrade" className={APP_PRIMARY_CTA_SM}>
            Unlock Premium
          </Link>
        ) : null}
        {display.showManageDashboard ? (
          <Link href="/dashboard" className={APP_SECONDARY_CTA}>
            Manage on dashboard
          </Link>
        ) : null}
      </div>
    </div>
  );
}
