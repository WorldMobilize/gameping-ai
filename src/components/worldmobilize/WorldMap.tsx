"use client";

import FeatureLayer from "@/components/worldmobilize/FeatureLayer";
import RegionLayer from "@/components/worldmobilize/RegionLayer";
import TerrainLayer from "@/components/worldmobilize/TerrainLayer";
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
 * The world scene, bottom to top:
 *   ocean → terrain/art → rivers/mountains/settlements → region borders →
 *   interaction hitboxes (+ region labels) → macro-area names.
 * Label tiers cross-fade with zoom: macro names when out, region names past
 * ~1.5×, capital names past ~2.1×.
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
  const showCapitalNames = relZoom >= 2.1;
  const macroLabelOpacity = relZoom >= 2.4 ? 0 : relZoom >= 1.5 ? 0.26 : 0.5;

  return (
    <svg
      viewBox={WORLD_VIEWBOX}
      width={WORLD_WIDTH}
      height={WORLD_HEIGHT}
      className="block"
      aria-label="WorldMobilize map — fictional world of claimable regions"
    >
      <defs>
        <radialGradient id="wm-ocean" cx="50%" cy="42%" r="78%">
          <stop offset="0%" stopColor="#0a1124" />
          <stop offset="55%" stopColor="#060a18" />
          <stop offset="100%" stopColor="#02030a" />
        </radialGradient>
        <pattern id="wm-dots" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#94a3b8" fillOpacity="0.08" />
        </pattern>
      </defs>

      {/* Ocean — clicking open water clears the selection. */}
      <rect x="0" y="0" width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#wm-ocean)" onClick={() => onSelect(null)} />
      <rect x="0" y="0" width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#wm-dots)" className="pointer-events-none" />

      {/* 1 — terrain/art */}
      <TerrainLayer />

      {/* 2 — rivers / mountains / forests / roads / settlements */}
      <FeatureLayer showCapitalNames={showCapitalNames} />

      {/* 3 — region borders (subtle, non-interactive) */}
      <g className="pointer-events-none" fill="none" stroke="#cbd5e1" strokeOpacity={0.15} strokeWidth={1}>
        {WORLD_REGIONS.map((region) => {
          const geometry = REGION_GEOMETRY[region.id];
          if (!geometry) return null;
          return <path key={region.id} d={geometry.path} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />;
        })}
      </g>

      {/* 4 — interaction/hitbox layer + region labels */}
      <RegionLayer selectedId={selectedId} showLabels={showRegionLabels} onSelect={onSelect} />

      {/* Macro-area names — fade out as region labels fade in. */}
      <g className="pointer-events-none transition-opacity duration-300" opacity={macroLabelOpacity}>
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
