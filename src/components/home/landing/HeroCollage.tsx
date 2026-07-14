import Image from "next/image";
import { steamHeaderImage } from "@/lib/curated/game-links";

/**
 * Hero background — a living wall of game covers. Columns of covers drift slowly
 * up and down at different speeds (parallax marquee), behind a bright central
 * portal with a cyan GamePing glow that holds the headline. Edges vignette into
 * the page. Motion is pure CSS and pauses under prefers-reduced-motion.
 *
 * Optimized via next/image (Steam host allowlisted). Presentation only.
 */

const NUM_COLS = 7;
const PER_COL = 10; // covers per column (duplicated for a seamless loop)

// Unique games across genres (header.jpg exists for every Steam app). Deduped.
const IDS = Array.from(
  new Set<number>([
    1245620, 1091500, 1174180, 271590, 1593500, 1888930, 990080, 2050650,
    601150, 1817070, 2358720, 1030840, 292030, 1086940, 489830, 377160, 435150,
    374320, 814380, 1627720, 1687950, 306130, 899770, 413150, 367520, 1145360,
    268910, 504230, 588650, 391540, 2379780, 646570, 1102190, 632470, 1794680,
    553850, 782330, 1240440, 1551360, 1293830, 949230, 1623730, 892970, 252490,
    1966720, 739630, 381210, 594650, 1085660, 1063730, 526870, 1158310, 289070,
    813780, 730, 578080, 570, 230410, 238960, 236390, 39210, 227300, 270880,
    346110, 251570, 304930, 648800, 394360, 255710, 244210, 805550, 310560,
    4000, 550, 220, 620, 322330, 359550, 236850, 552520, 1237970, 105600,
    1151640, 275850, 72850, 22380, 976730, 361420, 261550, 729040, 49520,
    1517290, 962130, 632360,
  ])
);

const COLUMNS = Array.from({ length: NUM_COLS }).map((_, c) => {
  const ids = Array.from({ length: PER_COL }).map(
    (_, r) => IDS[(c * PER_COL + r) % IDS.length]
  );
  return {
    ids,
    up: c % 2 === 0, // alternate scroll direction
    dur: 92 + (c % 3) * 16, // 92–124s — slow, calm drift (chill parallax)
  };
});

export default function HeroCollage() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* The moving wall of covers. */}
      <div className="absolute inset-0 flex gap-2 opacity-[0.85] dark:opacity-[0.55]">
        {COLUMNS.map((col, c) => (
          <div key={c} className="relative h-full flex-1 overflow-hidden">
            <div
              className="gp-marquee absolute inset-x-0 top-0 flex flex-col gap-2"
              style={{
                animation: `gp-marquee-${col.up ? "up" : "down"} ${col.dur}s linear infinite`,
              }}
            >
              {[...col.ids, ...col.ids].map((id, idx) => (
                <div
                  key={idx}
                  className="relative w-full overflow-hidden rounded-lg bg-slate-900 ring-1 ring-black/5 dark:ring-white/5"
                  style={{ aspectRatio: "460 / 215" }}
                >
                  <Image
                    src={steamHeaderImage(id)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 30vw, 16vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cinematic dark wash in dark mode so covers sit back behind the copy. */}
      <div className="absolute inset-0 hidden bg-[#0b0f1a]/35 dark:block" />

      {/* Cyan portal glow — the GamePing accent, a ring behind the headline. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(860px 660px at 50% 42%, rgba(34,211,238,0.32) 0%, rgba(34,211,238,0.12) 34%, transparent 64%)",
        }}
      />

      {/* Tall central portal — clears the covers down the whole copy column
       * (headline → button → pillars) so every word stays legible. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(920px 820px at 50% 50%, var(--gp-bg-base) 0%, var(--gp-bg-base) 44%, transparent 78%)",
        }}
      />

      {/* Edge vignette — fade the moving walls into the page on every side. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--gp-bg-base) 0%, transparent 12%, transparent 86%, var(--gp-bg-base) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, var(--gp-bg-base) 0%, transparent 10%, transparent 90%, var(--gp-bg-base) 100%)",
        }}
      />
    </div>
  );
}
