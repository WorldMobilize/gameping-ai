"use client";

import Link from "next/link";
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
      className={`rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-500/[0.12] via-[#0b0c18] to-cyan-500/[0.08] p-5 shadow-[0_0_36px_rgba(168,85,247,0.14)] ring-1 ring-white/10 ${className}`}
      role="status"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.32em] text-purple-200/95">
        {display.title}
      </p>
      <p className="mt-2.5 text-sm font-semibold leading-relaxed text-white/85">
        {display.body}
      </p>
      {display.footer ? (
        <p className="mt-2 text-xs leading-relaxed text-white/50">{display.footer}</p>
      ) : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {display.showSignupCta ? (
          <Link
            href={display.signupHref}
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-black shadow-[0_0_24px_rgba(34,211,238,0.22)] transition hover:bg-cyan-300"
          >
            {display.signupLabel}
          </Link>
        ) : null}
        {display.showUpgradeCta ? (
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-black shadow-[0_0_24px_rgba(34,211,238,0.22)] transition hover:bg-cyan-300"
          >
            Unlock Premium
          </Link>
        ) : null}
        {display.showManageDashboard ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 hover:bg-white/10"
          >
            Manage on dashboard
          </Link>
        ) : null}
      </div>
    </div>
  );
}
