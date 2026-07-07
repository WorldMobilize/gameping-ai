"use client";

import { MACRO_AREAS, WORLD_REGIONS } from "@/lib/worldmobilize/regions";
import {
  MACRO_AREA_LABELS,
  REGION_GEOMETRY,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "@/lib/worldmobilize/world-geometry";

/**
 * Terrain/art layer — purely decorative, zero pointer events:
 *   1. coast halo rings (stroked land copies under the fills → waterline)
 *   2. biome-tinted land fills (per-macro radial gradients anchored on the
 *      macro-area heartland, so each biome glows from its center)
 *   3. two turbulence passes clipped to the landmass: a low-frequency relief
 *      wash (light/dark terrain patches) and a fine grain (paper/ground)
 * Interaction stays on the hitbox layer above.
 */

const LAND_PATHS = WORLD_REGIONS.map((region) => ({
  id: region.id,
  macro: region.macroArea,
  path: REGION_GEOMETRY[region.id]?.path ?? "",
})).filter((p) => p.path);

export default function TerrainLayer() {
  return (
    <g className="pointer-events-none">
      <defs>
        {Object.values(MACRO_AREAS).map((macro) => {
          const anchor = MACRO_AREA_LABELS[macro.id];
          return (
            <radialGradient
              key={macro.id}
              id={`wm-terr-${macro.id}`}
              gradientUnits="userSpaceOnUse"
              cx={anchor?.x ?? WORLD_WIDTH / 2}
              cy={anchor?.y ?? WORLD_HEIGHT / 2}
              r={230}
            >
              <stop offset="0%" stopColor={macro.hex} stopOpacity={0.38} />
              <stop offset="70%" stopColor={macro.hex} stopOpacity={0.18} />
              <stop offset="100%" stopColor={macro.hex} stopOpacity={0.1} />
            </radialGradient>
          );
        })}

        <clipPath id="wm-landclip">
          {LAND_PATHS.map((p) => (
            <path key={p.id} d={p.path} />
          ))}
        </clipPath>

        {/* Low-frequency relief wash — large light/dark terrain patches. */}
        <filter id="wm-relief" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="2" seed="7" stitchTiles="stitch" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.92  0 0 0 0 0.96  0 0 0 0 1  0.55 0.55 0.55 0 -0.25"
          />
        </filter>

        {/* Fine ground grain. */}
        <filter id="wm-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="11" stitchTiles="stitch" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0.05  0 0 0 0 0.12  0.5 0.5 0.5 0 -0.28"
          />
        </filter>
      </defs>

      {/* Coast halo — wide soft ring + tighter waterline. Interior copies are
          hidden beneath the land fills painted right after. */}
      <g fill="none" stroke="#7dd3fc">
        {LAND_PATHS.map((p) => (
          <path key={`halo-${p.id}`} d={p.path} strokeWidth={16} strokeOpacity={0.045} strokeLinejoin="round" />
        ))}
        {LAND_PATHS.map((p) => (
          <path key={`line-${p.id}`} d={p.path} strokeWidth={6} strokeOpacity={0.09} strokeLinejoin="round" />
        ))}
      </g>

      {/* Land base + biome tint. */}
      <g>
        {LAND_PATHS.map((p) => (
          <path key={`base-${p.id}`} d={p.path} fill="#0f1728" />
        ))}
        {LAND_PATHS.map((p) => (
          <path key={`tint-${p.id}`} d={p.path} fill={`url(#wm-terr-${p.macro})`} />
        ))}
      </g>

      {/* Terrain texture, clipped to the landmass. */}
      <g clipPath="url(#wm-landclip)">
        <rect x="0" y="0" width={WORLD_WIDTH} height={WORLD_HEIGHT} filter="url(#wm-relief)" opacity={0.16} />
        <rect x="0" y="0" width={WORLD_WIDTH} height={WORLD_HEIGHT} filter="url(#wm-grain)" opacity={0.5} />
      </g>
    </g>
  );
}
