"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import MapToolbar from "@/components/worldmobilize/MapToolbar";
import MapViewport, { type MapCameraHandle } from "@/components/worldmobilize/MapViewport";
import CityScene, { citySceneSize } from "@/components/worldmobilize/city/CityScene";
import { MACRO_AREAS } from "@/lib/worldmobilize/regions";
import type { CityPrototype } from "@/lib/worldmobilize/cities";

const DEMO_PILL =
  "inline-flex items-center rounded-full border border-dashed border-amber-400/60 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300";

/**
 * Explorable city prototype — same camera/toolbar system as the world map,
 * pointed at the pseudo-isometric scene. POI pins open a detail card; the
 * back link returns to the world map with the parent region pre-selected.
 */
export default function CityView({ city }: { city: CityPrototype }) {
  const cameraRef = useRef<MapCameraHandle | null>(null);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const macro = MACRO_AREAS[city.macroArea];
  const selectedPoi = city.pois.find((p) => p.id === selectedPoiId) ?? null;
  const scene = citySceneSize(city);
  const backHref = `/worldmobilize?region=${city.regionId}`;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPoiId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const focusPoi = (id: string) => {
    setSelectedPoiId(id);
    const poi = city.pois.find((p) => p.id === id);
    if (!poi) return;
    // Convert tile coords to scene px (same projection as CityScene).
    const x = scene.ox + ((poi.tx - poi.ty) * 56) / 2;
    const y = scene.oy + ((poi.tx + poi.ty) * 28) / 2;
    cameraRef.current?.flyTo(x, y, { anchorXRatio: 0.5 });
  };

  return (
    <section className="relative z-10 px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 text-xs font-bold text-white/80 no-underline transition hover:border-cyan-400/50 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            World map
          </Link>
          <span
            className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ borderColor: `${macro.hex}55`, color: macro.hex, backgroundColor: `${macro.hex}14` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: macro.hex }} aria-hidden />
            {city.regionName} · {macro.name}
          </span>
          <span className={DEMO_PILL}>City prototype</span>
        </div>

        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl gp-home-display">
          {city.name}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">{city.intro}</p>

        {/* POI quick nav */}
        <div className="mt-6 flex flex-wrap gap-2">
          {city.pois.map((poi) => (
            <button
              key={poi.id}
              type="button"
              onClick={() => focusPoi(poi.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
                selectedPoiId === poi.id
                  ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200"
                  : "border-white/15 bg-white/[0.05] text-white/75 hover:border-cyan-400/40 hover:text-cyan-300"
              }`}
            >
              {poi.name}
            </button>
          ))}
        </div>

        {/* Scene */}
        <div className="relative mt-8 h-[64vh] min-h-[440px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a1026] via-[#070b1a] to-[#04060f] shadow-[0_32px_96px_rgba(0,0,0,0.55)] ring-1 ring-white/5">
          {/* stars */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-60 [background-image:radial-gradient(1px_1px_at_12%_30%,#e2e8f0_50%,transparent_50%),radial-gradient(1px_1px_at_34%_18%,#e2e8f0_50%,transparent_50%),radial-gradient(1.5px_1.5px_at_58%_36%,#e2e8f0_50%,transparent_50%),radial-gradient(1px_1px_at_76%_22%,#e2e8f0_50%,transparent_50%),radial-gradient(1px_1px_at_90%_40%,#e2e8f0_50%,transparent_50%)]" />

          <MapViewport ref={cameraRef} contentWidth={scene.w} contentHeight={scene.h}>
            <CityScene city={city} selectedPoiId={selectedPoiId} onSelectPoi={setSelectedPoiId} />
          </MapViewport>

          <MapToolbar
            onZoomIn={() => cameraRef.current?.zoomIn()}
            onZoomOut={() => cameraRef.current?.zoomOut()}
            onReset={() => {
              setSelectedPoiId(null);
              cameraRef.current?.reset();
            }}
          />

          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full border border-white/12 bg-[#0a0d1e]/85 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/75 backdrop-blur-md">
            {city.name} · Dusk
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden rounded-full border border-white/10 bg-[#0a0d1e]/75 px-3.5 py-1.5 text-[11px] font-semibold text-slate-300 backdrop-blur-md sm:block">
            Drag to pan · Scroll or pinch to zoom · Tap a marker
          </div>

          {/* POI detail card */}
          {selectedPoi ? (
            <aside
              aria-label={`${selectedPoi.name} details`}
              className="absolute inset-x-3 bottom-3 z-20 max-h-[46%] overflow-y-auto rounded-2xl border border-white/12 bg-[#080b1a]/92 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)] ring-1 ring-white/5 backdrop-blur-xl lg:inset-x-auto lg:bottom-4 lg:right-3 lg:top-auto lg:w-[320px]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/80">
                  Point of interest
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedPoiId(null)}
                  aria-label="Close point of interest"
                  className="rounded-full border border-white/15 bg-white/[0.06] p-1.5 text-white/70 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white gp-home-display">
                {selectedPoi.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{selectedPoi.description}</p>
            </aside>
          ) : null}
        </div>

        <p className="mt-8 max-w-2xl text-sm leading-6 text-slate-400">
          Visual prototype — an original settlement, no gameplay yet. City claims, districts,
          and community banners arrive with the founding season.
        </p>
      </div>
    </section>
  );
}
