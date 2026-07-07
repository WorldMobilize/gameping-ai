"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import MapToolbar from "@/components/worldmobilize/MapToolbar";
import MapViewport, { type MapCameraHandle } from "@/components/worldmobilize/MapViewport";
import RegionPanel from "@/components/worldmobilize/RegionPanel";
import WorldMap from "@/components/worldmobilize/WorldMap";
import { MACRO_AREA_LIST, REGIONS_BY_ID, WORLD_REGIONS } from "@/lib/worldmobilize/regions";
import { REGION_GEOMETRY } from "@/lib/worldmobilize/world-geometry";

const DEMO_PILL =
  "inline-flex items-center rounded-full border border-dashed border-amber-400/60 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300";

const ACCENT_BADGE =
  "inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-300";

/**
 * WorldMobilize — Phase 1: the interactive fictional world map foundation.
 * Selection state lives here; the camera is imperative (MapViewport handle)
 * so selecting a region can ease the view toward it.
 */
export default function WorldMobilizeView() {
  const cameraRef = useRef<MapCameraHandle | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRegion = selectedId ? (REGIONS_BY_ID[selectedId] ?? null) : null;

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    if (!id) return;
    const geometry = REGION_GEOMETRY[id];
    if (!geometry) return;
    // Desktop panel docks right, so anchor the region left of center.
    const desktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    cameraRef.current?.flyTo(geometry.cx, geometry.cy, {
      anchorXRatio: desktop ? 0.4 : 0.5,
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* Returning from a city (…?region=glowharbor): reopen that region's panel
   * and ease the camera to it. Runs once on mount, after the viewport's
   * layout-effect measurement, so flyTo has real container dimensions. */
  useEffect(() => {
    const regionId = new URLSearchParams(window.location.search).get("region");
    if (!regionId || !REGIONS_BY_ID[regionId]) return;
    queueMicrotask(() => handleSelect(regionId));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot deep-link restore
  }, []);

  return (
    <section className="relative z-10 px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
            World Mobilize
          </p>
          <span className={DEMO_PILL}>Admin-only concept</span>
          <span className={ACCENT_BADGE}>Phase 1 · Map foundation</span>
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
          One world. <span className="text-cyan-400">{WORLD_REGIONS.length} regions.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
          An original fictional world where communities will claim regions, raise capitals, and
          compete for territory. Pan, zoom, and scout the map — claiming opens with Season 1.
        </p>

        {/* Map */}
        <div className="relative mt-10 h-[68vh] min-h-[460px] overflow-hidden rounded-3xl border border-white/10 bg-[#03040c] shadow-[0_32px_96px_rgba(0,0,0,0.55)] ring-1 ring-white/5">
          <MapViewport ref={cameraRef}>
            <WorldMap selectedId={selectedId} onSelect={handleSelect} />
          </MapViewport>

          <MapToolbar
            onZoomIn={() => cameraRef.current?.zoomIn()}
            onZoomOut={() => cameraRef.current?.zoomOut()}
            onReset={() => {
              setSelectedId(null);
              cameraRef.current?.reset();
            }}
          />

          {/* Season chip */}
          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full border border-white/12 bg-[#0a0d1e]/85 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/75 backdrop-blur-md">
            Season 0 · Pre-season
          </div>

          {/* Controls hint */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden rounded-full border border-white/10 bg-[#0a0d1e]/75 px-3.5 py-1.5 text-[11px] font-semibold text-slate-300 backdrop-blur-md sm:block">
            Drag to pan · Scroll or pinch to zoom · Click a region
          </div>

          {selectedRegion ? (
            <RegionPanel region={selectedRegion} onClose={() => setSelectedId(null)} />
          ) : null}
        </div>

        {/* Macro-area legend */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5">
          {MACRO_AREA_LIST.map((macro) => (
            <span key={macro.id} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: macro.hex, boxShadow: `0 0 8px ${macro.hex}66` }}
                aria-hidden
              />
              {macro.name}
            </span>
          ))}
        </div>

        {/* Subpage — Community Wars, the live creator layer. */}
        <Link
          href="/community-wars"
          className="group mt-10 flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#080b1a]/80 p-6 no-underline ring-1 ring-white/5 backdrop-blur-md transition hover:border-violet-400/40 hover:ring-violet-400/20 sm:flex-row sm:items-center sm:justify-between md:p-7"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-300">
              World Mobilize · Live layer
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white gp-home-display">
              Community Wars
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Creator-led battles: Twitch communities become factions, rally live, and push
              territory momentum on this map. Concept demo.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-violet-400/45 bg-violet-500/10 px-4 py-2 text-sm font-black text-violet-200 transition group-hover:border-violet-300 group-hover:bg-violet-500/20">
            Open Community Wars
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>

        <p className="mt-8 max-w-2xl text-sm leading-6 text-slate-400">
          Every region is fictional and original — invented names, invented coastlines. Static
          world data for now: no ownership, no battles, no payments. The claim flow is a
          placeholder already shaped for Stripe.
        </p>
      </div>
    </section>
  );
}
