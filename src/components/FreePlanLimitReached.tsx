"use client";

import Link from "next/link";
import {
  FREE_LIMIT_BODY,
  FREE_PLAN_LIMIT_TITLE,
  PREMIUM_UNLOCK_LINE,
  type FreePlanLimitVariant,
} from "@/lib/product-copy";

type Props = {
  variant: FreePlanLimitVariant;
  className?: string;
};

export default function FreePlanLimitReached({ variant, className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-500/[0.12] via-[#0b0c18] to-cyan-500/[0.08] p-5 shadow-[0_0_36px_rgba(168,85,247,0.14)] ring-1 ring-white/10 ${className}`}
      role="status"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.32em] text-purple-200/95">
        {FREE_PLAN_LIMIT_TITLE}
      </p>
      <p className="mt-2.5 text-sm font-semibold leading-relaxed text-white/85">
        {FREE_LIMIT_BODY[variant]}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-white/50">{PREMIUM_UNLOCK_LINE}</p>
      <Link
        href="/upgrade"
        className="mt-4 inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-black shadow-[0_0_24px_rgba(34,211,238,0.22)] transition hover:bg-cyan-300"
      >
        Unlock Premium
      </Link>
    </div>
  );
}
