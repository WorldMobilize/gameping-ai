"use client";

import MapRegion from "@/components/worldmobilize/MapRegion";
import { MACRO_AREAS, WORLD_REGIONS } from "@/lib/worldmobilize/regions";
import { REGION_GEOMETRY } from "@/lib/worldmobilize/world-geometry";

/** All selectable regions, joined data ↔ geometry (data never lives in JSX). */
export default function RegionLayer({
  selectedId,
  showLabels,
  onSelect,
}: {
  selectedId: string | null;
  showLabels: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <g>
      {WORLD_REGIONS.map((region) => {
        const geometry = REGION_GEOMETRY[region.id];
        if (!geometry) return null;
        return (
          <MapRegion
            key={region.id}
            region={region}
            geometry={geometry}
            hex={MACRO_AREAS[region.macroArea].hex}
            selected={selectedId === region.id}
            dimmed={selectedId !== null && selectedId !== region.id}
            showLabel={showLabels}
            onSelect={onSelect}
          />
        );
      })}
    </g>
  );
}
