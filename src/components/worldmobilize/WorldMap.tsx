"use client";

import RegionLayer from "@/components/worldmobilize/RegionLayer";
import { useRelativeZoom } from "@/components/worldmobilize/MapViewport";
import { MACRO_AREAS, WORLD_REGIONS } from "@/lib/worldmobilize/regions";
import {
  MACRO_AREA_LABELS,
  REGION_GEOMETRY,
  WORLD_HEIGHT,
  WORLD_VIEWBOX,
  WORLD_WIDTH,
} from "@/lib/worldmobilize/world-geometry";

/**
 * The world scene: atmospheric ocean, soft landmass under-glow, selectable
 * regions, and two label tiers — macro-area names when zoomed out, region
 * names once you push in past ~1.5× (they cross-fade on the zoom level from
 * MapViewport's camera context).
 */
export default function WorldMap({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const relZoom = useRelativeZoom();
  const showRegionLabels = relZoom >= 1.5;
  const macroLabelOpacity = relZoom >= 2.4 ? 0 : relZoom >= 1.5 ? 0.28 : 0.55;

  return (
    <svg
      viewBox={WORLD_VIEWBOX}
      width={WORLD_WIDTH}
      height={WORLD_HEIGHT}
      className="block"
      aria-label="WorldMobilize map — fictional world of claimable regions"
    >
      <defs>
        <radialGradient id="wm-ocean" cx="50%" cy="42%" r="75%">
          <stop offset="0%" stopColor="#0b1226" />
          <stop offset="55%" stopColor="#070b1a" />
          <stop offset="100%" stopColor="#03040c" />
        </radialGradient>
        <pattern id="wm-dots" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#94a3b8" fillOpacity="0.10" />
        </pattern>
      </defs>

      {/* Ocean — clicking open water clears the selection. */}
      <rect
        x="0"
        y="0"
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        fill="url(#wm-ocean)"
        onClick={() => onSelect(null)}
      />
      <rect
        x="0"
        y="0"
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        fill="url(#wm-dots)"
        className="pointer-events-none"
      />

      {/* Landmass under-glow — blurred copies beneath the interactive layer. */}
      <g className="pointer-events-none" opacity="0.4" style={{ filter: "blur(14px)" }}>
        {WORLD_REGIONS.map((region) => {
          const geometry = REGION_GEOMETRY[region.id];
          if (!geometry) return null;
          return (
            <path
              key={region.id}
              d={geometry.path}
              fill={MACRO_AREAS[region.macroArea].hex}
              fillOpacity="0.5"
            />
          );
        })}
      </g>

      <RegionLayer selectedId={selectedId} showLabels={showRegionLabels} onSelect={onSelect} />

      {/* Macro-area names — fade out as region labels fade in. */}
      <g
        className="pointer-events-none transition-opacity duration-300"
        opacity={macroLabelOpacity}
      >
        {Object.entries(MACRO_AREA_LABELS).map(([id, pos]) => {
          const macro = MACRO_AREAS[id as keyof typeof MACRO_AREAS];
          if (!macro) return null;
          return (
            <text
              key={id}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={16}
              letterSpacing="0.3em"
              fill="#e2e8f0"
              className="font-black uppercase"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.95)" }}
            >
              {macro.name}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
