"use client";

import { useToast } from "@/components/ToastProvider";
import { startRegionClaim } from "@/lib/worldmobilize/claim";
import type { WorldRegion } from "@/lib/worldmobilize/types";

/**
 * Claim CTA — placeholder flow, already shaped for Stripe. Phase 2 swaps
 * startRegionClaim's body for a checkout-session request and redirects to
 * result.checkoutUrl; this component won't need to change.
 */
export default function ClaimRegionButton({ region }: { region: WorldRegion }) {
  const { showToast } = useToast();

  const handleClaim = () => {
    const result = startRegionClaim(region.id);
    if (result.ok) {
      window.location.href = result.checkoutUrl;
      return;
    }
    showToast({
      variant: "info",
      title: "Claims open with Season 1",
      message: `${region.name} will be claimable for ${region.priceDisplay} when the founding season starts.`,
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClaim}
        className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black tracking-tight text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        Claim {region.name} · {region.priceDisplay}
      </button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400">
        Payments aren&apos;t live yet — this becomes Stripe checkout in a later phase.
      </p>
    </div>
  );
}
