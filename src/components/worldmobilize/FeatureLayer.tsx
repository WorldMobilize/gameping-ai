"use client";

import { MACRO_AREAS, REGIONS_BY_ID } from "@/lib/worldmobilize/regions";
import type { MacroAreaId } from "@/lib/worldmobilize/types";
import {
  DUNES,
  FORESTS,
  LAKES,
  MOUNTAINS,
  RIVERS,
  ROADS,
  SETTLEMENTS,
  type MapFeaturePoint,
} from "@/lib/worldmobilize/world-features";

/**
 * Rivers / mountains / forests / dunes / roads / settlements — the "life"
 * layer between terrain and region borders. Decorative and pointer-inert;
 * all data comes from the generated world-features file. Capital names fade
 * in at close zoom (threshold handled by WorldMap).
 */

const FOREST_TINT: Partial<Record<MacroAreaId, string>> = {
  "verdant-hollow": "#34d399",
  "palegrave": "#8ed3c6",
  "lumen-coast": "#2dd4bf",
  "thunder-steppe": "#86c08c",
  "cinderveil": "#b45f52", // charred woods
  "shardpelago": "#2dd4bf",
};

const PEAK_CAP_TINT: Partial<Record<MacroAreaId, string>> = {
  "palegrave": "#eef2f7", // snow
  "cinderveil": "#fb7185", // ember
  "hollowmark": "#94a3b8", // ash
};

function Mountain({ p }: { p: MapFeaturePoint }) {
  const s = p.s;
  const cap = PEAK_CAP_TINT[p.macro as MacroAreaId] ?? "#cbd5e1";
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      <path
        d={`M ${-s} ${s * 0.55} L ${-s * 0.1} ${-s} L ${s} ${s * 0.55} Z`}
        fill="#2a3448"
        stroke="#e2e8f0"
        strokeOpacity={0.22}
        strokeWidth={0.6}
        strokeLinejoin="round"
      />
      <path
        d={`M ${-s * 0.1} ${-s} L ${s} ${s * 0.55} L ${s * 0.22} ${s * 0.55} Z`}
        fill="#151c2c"
        fillOpacity={0.85}
      />
      <path
        d={`M ${-s * 0.1} ${-s} L ${-s * 0.36} ${-s * 0.42} L ${-s * 0.04} ${-s * 0.54} L ${s * 0.26} ${-s * 0.38} Z`}
        fill={cap}
        fillOpacity={0.85}
      />
    </g>
  );
}

function Forest({ p }: { p: MapFeaturePoint }) {
  const s = p.s;
  const tint = FOREST_TINT[p.macro as MacroAreaId] ?? "#34d399";
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      <rect x={-s * 0.09} y={-s * 0.1} width={s * 0.18} height={s * 0.5} fill="#3b2f24" />
      <circle cx={0} cy={-s * 0.42} r={s * 0.52} fill={tint} fillOpacity={0.8} />
      <circle cx={-s * 0.18} cy={-s * 0.3} r={s * 0.3} fill={tint} fillOpacity={0.55} />
      <circle cx={s * 0.14} cy={-s * 0.58} r={s * 0.2} fill="#f0fdf4" fillOpacity={0.18} />
    </g>
  );
}

function Dune({ p }: { p: MapFeaturePoint }) {
  const s = p.s;
  return (
    <g transform={`translate(${p.x} ${p.y})`} fill="none" strokeLinecap="round">
      <path d={`M ${-s} 0 Q 0 ${-s * 0.62} ${s} 0`} stroke="#eab308" strokeOpacity={0.4} strokeWidth={1.3} />
      <path d={`M ${-s * 0.35} ${s * 0.35} Q ${s * 0.25} ${-s * 0.1} ${s * 0.8} ${s * 0.3}`} stroke="#d9a441" strokeOpacity={0.28} strokeWidth={1} />
    </g>
  );
}

export default function FeatureLayer({ showCapitalNames }: { showCapitalNames: boolean }) {
  return (
    <g className="pointer-events-none">
      {/* Trade roads — under water features so rivers cross visibly. */}
      <g fill="none" stroke="#eab308" strokeOpacity={0.26} strokeWidth={1.2} strokeDasharray="5 4" strokeLinecap="round">
        {ROADS.map((d, i) => (
          <path key={`road-${i}`} d={d} />
        ))}
      </g>

      {/* Rivers — wide glow + bright core. */}
      <g fill="none" strokeLinecap="round">
        {RIVERS.map((d, i) => (
          <g key={`river-${i}`}>
            <path d={d} stroke="#67e8f9" strokeOpacity={0.26} strokeWidth={3.6} />
            <path d={d} stroke="#a5f3fc" strokeOpacity={0.55} strokeWidth={1.3} />
          </g>
        ))}
      </g>

      {/* Lakes. */}
      <g>
        {LAKES.map((d, i) => (
          <path key={`lake-${i}`} d={d} fill="#0c4a6e" fillOpacity={0.6} stroke="#7dd3fc" strokeOpacity={0.45} strokeWidth={1} />
        ))}
      </g>

      {/* Relief + vegetation glyphs. */}
      <g>
        {DUNES.map((p, i) => (
          <Dune key={`dune-${i}`} p={p} />
        ))}
        {FORESTS.map((p, i) => (
          <Forest key={`forest-${i}`} p={p} />
        ))}
        {MOUNTAINS.map((p, i) => (
          <Mountain key={`mtn-${i}`} p={p} />
        ))}
      </g>

      {/* Settlements — every region has one; the macro-area's principal
          settlement gets the larger ringed glyph. */}
      <g>
        {Object.entries(SETTLEMENTS).map(([regionId, s]) => {
          const region = REGIONS_BY_ID[regionId];
          if (!region) return null;
          const hex = MACRO_AREAS[region.macroArea].hex;
          return (
            <g key={`stl-${regionId}`} transform={`translate(${s.x} ${s.y})`}>
              <circle r={s.major ? 7.5 : 5} fill={hex} fillOpacity={0.22} />
              {s.major ? (
                <rect
                  x={-4.4}
                  y={-4.4}
                  width={8.8}
                  height={8.8}
                  transform="rotate(45)"
                  fill="none"
                  stroke={hex}
                  strokeOpacity={0.85}
                  strokeWidth={1}
                />
              ) : null}
              <circle r={s.major ? 2.7 : 1.9} fill="#f8fafc" stroke={hex} strokeWidth={0.8} />
              {showCapitalNames ? (
                <text
                  y={s.major ? 15 : 12}
                  textAnchor="middle"
                  fontSize={6.5}
                  fill="#e2e8f0"
                  fillOpacity={0.85}
                  className="font-semibold"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}
                >
                  {region.capitalName}
                </text>
              ) : null}
            </g>
          );
        })}
      </g>
    </g>
  );
}
