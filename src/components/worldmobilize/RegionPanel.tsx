"use client";

import ClaimRegionButton from "@/components/worldmobilize/ClaimRegionButton";
import { MACRO_AREAS } from "@/lib/worldmobilize/regions";
import { REGION_STATUS_META } from "@/lib/worldmobilize/statuses";
import type { WorldRegion } from "@/lib/worldmobilize/types";

/**
 * Region detail panel — glass card overlaying the map. Desktop: right rail.
 * Mobile: bottom sheet (both handled by the responsive classes below).
 * Status badge + owner line render from data, so future states (owned,
 * contested, capital, …) appear here without layout changes.
 */
export default function RegionPanel({
  region,
  onClose,
}: {
  region: WorldRegion;
  onClose: () => void;
}) {
  const macro = MACRO_AREAS[region.macroArea];
  const statusMeta = REGION_STATUS_META[region.status];

  return (
    <aside
      aria-label={`${region.name} details`}
      className="absolute inset-x-3 bottom-3 z-20 max-h-[58%] overflow-y-auto rounded-2xl border border-white/12 bg-[#080b1a]/92 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)] ring-1 ring-white/5 backdrop-blur-xl lg:inset-x-auto lg:bottom-4 lg:right-3 lg:top-4 lg:max-h-none lg:w-[330px]"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ borderColor: `${macro.hex}55`, color: macro.hex, backgroundColor: `${macro.hex}14` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: macro.hex }} aria-hidden />
          {macro.name}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close region details"
          className="rounded-full border border-white/15 bg-white/[0.06] p-1.5 text-white/70 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <h2 className="mt-4 text-2xl font-black tracking-tight text-white gp-home-display">
        {region.name}
      </h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Capital · {region.capitalName}
      </p>

      <p className="mt-4 text-sm leading-6 text-slate-300">{region.flavorText}</p>

      <dl className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-400">Status</dt>
          <dd>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.badgeClass}`}
            >
              {statusMeta.label}
            </span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-400">Owner</dt>
          <dd className="font-semibold text-slate-200">
            {region.owner ?? "Nobody — unclaimed"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-400">Founder claim</dt>
          <dd className="text-base font-black tabular-nums text-white">
            {region.priceDisplay}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <ClaimRegionButton region={region} />
      </div>

      {/* Future season hook — becomes live season/war info in later phases. */}
      <div className="mt-5 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3.5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/80">
          Season 0 · Pre-season
        </p>
        <p className="mt-1.5 text-xs leading-5 text-slate-400">
          The founding season opens later — capitals, banners, and territory wars arrive in
          future phases.
        </p>
      </div>
    </aside>
  );
}
