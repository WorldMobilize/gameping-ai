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
      className={`rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-cyan-50/60 p-5 shadow-sm shadow-violet-100/40 ${className}`}
      role="status"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-violet-700">
        {display.title}
      </p>
      <p className="mt-2.5 text-sm font-semibold leading-relaxed text-slate-800">
        {display.body}
      </p>
      {display.footer ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{display.footer}</p>
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
