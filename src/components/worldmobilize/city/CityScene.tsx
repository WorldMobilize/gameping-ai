"use client";

import { memo } from "react";
import type { CityPrototype } from "@/lib/worldmobilize/cities";

/**
 * Pseudo-isometric city renderer (pure SVG, no assets). Classic 2:1 diamond
 * projection; painter's algorithm (tx+ty) keeps depth correct. Everything is
 * drawn from the city data object — no layout lives in this component.
 *
 * Layers: harbor glow → ground tiles → buildings/lamps/beacon (depth-sorted)
 * → POI pins. Lights use `animate-pulse` (motion-reduce safe) for a living,
 * dusk-neon atmosphere without heavy per-frame work.
 */

const TW = 56; // tile width  (px)
const TH = 28; // tile height (px)
const MARGIN = 72;
const SKY = 130; // headroom for towers, beacon beam, and POI pins

export function citySceneSize(city: CityPrototype) {
  const w = MARGIN * 2 + ((city.cols + city.rows) * TW) / 2;
  const h = SKY + ((city.cols + city.rows - 2) * TH) / 2 + TH + 60;
  const ox = MARGIN + ((city.rows - 1) * TW) / 2 + TW / 2;
  const oy = SKY;
  return { w, h, ox, oy };
}

type XY = { x: number; y: number };

function iso(ox: number, oy: number, tx: number, ty: number): XY {
  return { x: ox + ((tx - ty) * TW) / 2, y: oy + ((tx + ty) * TH) / 2 };
}

function diamond(c: XY, tw = TW, th = TH): string {
  return `${c.x},${c.y - th / 2} ${c.x + tw / 2},${c.y} ${c.x},${c.y + th / 2} ${c.x - tw / 2},${c.y}`;
}

const TILE_FILL: Record<string, string> = {
  ground: "#141b2e",
  street: "#202a42",
  plaza: "#2a3452",
  water: "#0a3a5c",
  pier: "#3a2d20",
};

const TILE_STROKE: Record<string, string> = {
  ground: "#1d2740",
  street: "#2b3654",
  plaza: "#3a4668",
  water: "#0e4a72",
  pier: "#57432f",
};

function Building({
  c,
  h,
  neon,
  kind,
  seed,
}: {
  c: XY;
  h: number;
  neon: boolean;
  kind: "tower" | "block" | "shed";
  seed: number;
}) {
  const tw = TW * 0.8;
  const th = TH * 0.8;
  const top: XY = { x: c.x, y: c.y - h };

  const faceTop = {
    left: kind === "shed" ? "#232c44" : "#2b3554",
    right: kind === "shed" ? "#1a2136" : "#20294200",
  };

  // Window dots along each face midline, on/off from the building seed.
  const windows: Array<{ x: number; y: number; lit: boolean; warm: boolean }> = [];
  const rowsOfWindows = Math.max(1, Math.floor(h / 9));
  for (let i = 0; i < rowsOfWindows; i++) {
    const z = 6 + i * 8;
    if (z > h - 4) break;
    for (const side of [-1, 1]) {
      const bit = (seed >> ((i * 2 + (side + 1) / 2) % 20)) & 1;
      windows.push({
        x: c.x + side * tw * 0.22,
        y: c.y + th * 0.11 - z,
        lit: bit === 1,
        warm: ((seed >> ((i + 7) % 20)) & 1) === 1,
      });
    }
  }

  return (
    <g>
      {/* left + right faces */}
      <polygon
        points={`${c.x - tw / 2},${c.y} ${c.x},${c.y + th / 2} ${c.x},${c.y + th / 2 - h} ${c.x - tw / 2},${c.y - h}`}
        fill={faceTop.left}
      />
      <polygon
        points={`${c.x + tw / 2},${c.y} ${c.x},${c.y + th / 2} ${c.x},${c.y + th / 2 - h} ${c.x + tw / 2},${c.y - h}`}
        fill="#161d31"
      />
      {/* roof */}
      <polygon
        points={diamond(top, tw, th)}
        fill={kind === "tower" ? "#333f63" : "#2a3450"}
        stroke={neon ? "#22d3ee" : "#3d4a70"}
        strokeOpacity={neon ? 0.85 : 0.6}
        strokeWidth={neon ? 1 : 0.6}
      />
      {kind === "tower" ? (
        <line x1={top.x} y1={top.y - th / 2} x2={top.x} y2={top.y - th / 2 - 7} stroke="#67e8f9" strokeOpacity={0.7} strokeWidth={1} />
      ) : null}
      {/* windows */}
      {windows.map((w, i) =>
        w.lit ? (
          <circle
            key={i}
            cx={w.x}
            cy={w.y}
            r={1.1}
            fill={w.warm ? "#fbbf24" : "#67e8f9"}
            fillOpacity={neon ? 0.95 : 0.65}
          />
        ) : null
      )}
    </g>
  );
}

function Beacon({ c }: { c: XY }) {
  const h = 58;
  return (
    <g>
      {/* light beam sweeping the harbor */}
      <polygon
        points={`${c.x},${c.y - h} ${c.x + 120},${c.y - h - 26} ${c.x + 120},${c.y - h + 18}`}
        fill="#22d3ee"
        fillOpacity={0.1}
        className="animate-pulse motion-reduce:animate-none"
      />
      {/* tower */}
      <polygon points={`${c.x - 6},${c.y} ${c.x - 3.6},${c.y - h} ${c.x + 3.6},${c.y - h} ${c.x + 6},${c.y}`} fill="#2b3554" stroke="#3d4a70" strokeWidth={0.6} />
      <rect x={c.x - 6.5} y={c.y - h * 0.62} width={13} height={3.4} fill="#e2e8f0" fillOpacity={0.22} />
      {/* lamp room */}
      <circle cx={c.x} cy={c.y - h - 3} r={4} fill="#67e8f9" className="animate-pulse motion-reduce:animate-none" />
      <circle cx={c.x} cy={c.y - h - 3} r={9} fill="#22d3ee" fillOpacity={0.25} className="animate-pulse motion-reduce:animate-none" />
    </g>
  );
}

function CitySceneInner({
  city,
  selectedPoiId,
  onSelectPoi,
}: {
  city: CityPrototype;
  selectedPoiId: string | null;
  onSelectPoi: (id: string | null) => void;
}) {
  const { w, h, ox, oy } = citySceneSize(city);

  // Depth-sorted drawables (buildings + lamps + beacon share the pass).
  const drawables: Array<{ depth: number; el: React.ReactNode }> = [];

  city.buildings.forEach((b) => {
    const c = iso(ox, oy, b.tx, b.ty);
    drawables.push({
      depth: b.tx + b.ty,
      el: <Building key={`b-${b.tx}-${b.ty}`} c={c} h={b.h} neon={b.neon} kind={b.kind} seed={b.seed} />,
    });
  });

  city.lamps.forEach((l, i) => {
    const c = iso(ox, oy, l.tx, l.ty);
    drawables.push({
      depth: l.tx + l.ty,
      el: (
        <g key={`lamp-${i}`}>
          <line x1={c.x} y1={c.y} x2={c.x} y2={c.y - 12} stroke="#475569" strokeWidth={0.9} />
          <circle cx={c.x} cy={c.y - 13} r={1.6} fill="#67e8f9" />
          <circle cx={c.x} cy={c.y - 13} r={4.5} fill="#22d3ee" fillOpacity={0.18} className="animate-pulse motion-reduce:animate-none" />
        </g>
      ),
    });
  });

  const beaconPoi = city.pois.find((p) => p.kind === "beacon");
  if (beaconPoi) {
    const c = iso(ox, oy, beaconPoi.tx, beaconPoi.ty);
    drawables.push({ depth: beaconPoi.tx + beaconPoi.ty + 0.1, el: <Beacon key="beacon" c={c} /> });
  }

  drawables.sort((a, b) => a.depth - b.depth);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block" aria-label={`${city.name} — city prototype`}>
      <defs>
        <radialGradient id="bq-glow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.14} />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="bq-water" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>
      </defs>

      {/* city glow */}
      <ellipse cx={ox} cy={oy + ((city.cols + city.rows) * TH) / 4} rx={w * 0.45} ry={h * 0.4} fill="url(#bq-glow)" />

      {/* ground tiles */}
      <g onClick={() => onSelectPoi(null)}>
        {city.tiles.map((row, ty) =>
          row.map((tile, tx) => {
            const c = iso(ox, oy, tx, ty);
            return (
              <g key={`t-${tx}-${ty}`}>
                <polygon
                  points={diamond(c)}
                  fill={tile === "water" ? "url(#bq-water)" : TILE_FILL[tile]}
                  stroke={TILE_STROKE[tile]}
                  strokeWidth={0.6}
                />
                {tile === "water" ? (
                  <line
                    x1={c.x - TW * 0.22}
                    y1={c.y + ((tx * 7 + ty * 5) % 3) - 1}
                    x2={c.x + TW * 0.2}
                    y2={c.y + ((tx * 7 + ty * 5) % 3) - 1}
                    stroke="#38bdf8"
                    strokeOpacity={0.18}
                    strokeWidth={0.8}
                  />
                ) : null}
                {tile === "plaza" ? (
                  <circle cx={c.x} cy={c.y} r={1.4} fill="#67e8f9" fillOpacity={0.16} />
                ) : null}
              </g>
            );
          })
        )}
      </g>

      {/* buildings, lamps, beacon — depth sorted */}
      <g>{drawables.map((d) => d.el)}</g>

      {/* POI pins — on top, clickable */}
      <g>
        {city.pois.map((poi) => {
          const c = iso(ox, oy, poi.tx, poi.ty);
          const selected = selectedPoiId === poi.id;
          const lift = poi.kind === "beacon" ? 78 : 36;
          return (
            <g
              key={poi.id}
              transform={`translate(${c.x} ${c.y - lift})`}
              role="button"
              tabIndex={0}
              aria-label={`Point of interest: ${poi.name}`}
              className="cursor-pointer outline-none"
              onClick={(e) => {
                e.stopPropagation();
                onSelectPoi(selected ? null : poi.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPoi(selected ? null : poi.id);
                }
              }}
            >
              <line x1={0} y1={6} x2={0} y2={lift - 6} stroke="#67e8f9" strokeOpacity={selected ? 0.6 : 0.3} strokeWidth={0.9} strokeDasharray="2 2" />
              <circle r={selected ? 7 : 5.5} fill="#0b1226" stroke={selected ? "#f8fafc" : "#22d3ee"} strokeWidth={selected ? 1.6 : 1.2} />
              <circle r={2.2} fill={selected ? "#f8fafc" : "#67e8f9"} className={selected ? "" : "animate-pulse motion-reduce:animate-none"} />
              <title>{poi.name}</title>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const CityScene = memo(CitySceneInner);
export default CityScene;
