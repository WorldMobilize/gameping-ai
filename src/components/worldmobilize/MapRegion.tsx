"use client";

import { memo, useState } from "react";
import { REGION_STATUS_META } from "@/lib/worldmobilize/statuses";
import type { WorldRegion } from "@/lib/worldmobilize/types";
import type { RegionGeometry } from "@/lib/worldmobilize/world-geometry";

/**
 * One selectable region polygon. Base fill opacity comes from the region's
 * STATUS (future-proofed for owned/contested/…); hover and selection are pure
 * UI states layered on top. Borders use non-scaling strokes so they stay
 * hairline-thin at any zoom.
 */

type Props = {
  region: WorldRegion;
  geometry: RegionGeometry;
  hex: string;
  selected: boolean;
  /** True when ANOTHER region is selected — dims this one for contrast. */
  dimmed: boolean;
  showLabel: boolean;
  onSelect: (id: string) => void;
};

function MapRegionInner({ region, geometry, hex, selected, dimmed, showLabel, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);

  const base = REGION_STATUS_META[region.status].fillOpacity;
  const fillOpacity = selected
    ? Math.min(base + 0.42, 0.85)
    : hovered
      ? Math.min(base + 0.24, 0.7)
      : dimmed
        ? base * 0.55
        : base;

  const glow =
    selected
      ? `drop-shadow(0 0 14px ${hex}) drop-shadow(0 0 3px ${hex})`
      : hovered
        ? `drop-shadow(0 0 9px ${hex})`
        : "none";

  return (
    <g>
      <path
        d={geometry.path}
        fill={hex}
        fillOpacity={fillOpacity}
        stroke={selected ? "#f8fafc" : hex}
        strokeOpacity={selected ? 0.9 : 0.55}
        strokeWidth={selected ? 1.8 : 1}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        role="button"
        tabIndex={0}
        aria-label={`${region.name} — ${REGION_STATUS_META[region.status].label}`}
        aria-pressed={selected}
        className="cursor-pointer outline-none transition-[fill-opacity] duration-200"
        style={{ filter: glow }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={() => onSelect(region.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(region.id);
          }
        }}
      >
        <title>{region.name}</title>
      </path>
      {showLabel ? (
        <text
          x={geometry.cx}
          y={geometry.cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fill="#f1f5f9"
          fillOpacity={selected || hovered ? 0.95 : 0.72}
          className="pointer-events-none font-semibold"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
        >
          {region.name}
        </text>
      ) : null}
    </g>
  );
}

const MapRegion = memo(MapRegionInner);
export default MapRegion;
