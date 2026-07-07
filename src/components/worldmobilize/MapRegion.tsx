"use client";

import { memo, useState } from "react";
import { REGION_STATUS_META } from "@/lib/worldmobilize/statuses";
import type { WorldRegion } from "@/lib/worldmobilize/types";
import type { RegionGeometry } from "@/lib/worldmobilize/world-geometry";

/**
 * Interaction/hitbox layer for one region. The terrain art lives in the
 * layers below — this path is invisible until hovered/selected, then adds
 * the accent tint, emphasis stroke, and glow. When another region is
 * selected, this one darkens slightly so the selection pops.
 * Future statuses (owned/contested/…) can tint here via REGION_STATUS_META.
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

  const fill = selected || hovered ? hex : "#04060f";
  const fillOpacity = selected ? 0.2 : hovered ? 0.14 : dimmed ? 0.32 : 0;

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
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={selected ? "#f8fafc" : hovered ? hex : "transparent"}
        strokeOpacity={selected ? 0.95 : 0.8}
        strokeWidth={selected ? 2 : 1.4}
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
          y={geometry.cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fill="#f1f5f9"
          fillOpacity={selected || hovered ? 0.95 : 0.75}
          className="pointer-events-none font-bold"
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
