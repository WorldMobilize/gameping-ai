"use client";

import Image from "next/image";
import {
  HOME_HERO_COLLAGE_COLUMNS,
} from "@/components/home/home-hero-collage-data";

type Props = {
  isDark?: boolean;
};

/**
 * Static game-discovery collage for the hero (presentational only).
 * Images are static placeholder Steam library covers — no dynamic fetching.
 */
/** Per-column depth so covers sit slightly forward/back (subtle 3D, no new art). */
const COLUMN_DEPTH_PX = [-34, 40, -12];

export default function HomeHeroCollage({ isDark = false }: Props) {
  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
      <div className="relative" style={{ perspective: "1200px" }}>
        <div
          className="grid grid-cols-3 gap-3 sm:gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_8%,black)]"
          style={{ transformStyle: "preserve-3d" }}
          aria-hidden
        >
          {HOME_HERO_COLLAGE_COLUMNS.map((column, colIndex) => (
            <div
              key={colIndex}
              className={`flex flex-col gap-3 sm:gap-4 ${column.offsetClass}`}
              style={{
                transform: `translateZ(${COLUMN_DEPTH_PX[colIndex] ?? 0}px)`,
              }}
            >
              {column.items.map((item, rowIndex) => {
                const isFirst = colIndex === 0 && rowIndex === 0;
                return (
                  <div
                    key={item.title}
                    className={`relative overflow-hidden rounded-2xl border shadow-md ${
                      isDark
                        ? "border-white/10 shadow-black/25"
                        : "border-slate-200/80 shadow-slate-900/10"
                    } ${item.rotateClass}`}
                  >
                    <Image
                      src={item.image}
                      alt=""
                      width={600}
                      height={900}
                      sizes="(max-width: 1024px) 28vw, 170px"
                      className="aspect-[2/3] h-auto w-full object-cover"
                      priority={isFirst}
                      loading={isFirst ? undefined : "lazy"}
                    />
                    {/* Light-catching top edge + depth gradient at the base */}
                    <div
                      className={`pointer-events-none absolute inset-0 ${
                        isDark
                          ? "bg-gradient-to-t from-black/25 via-transparent to-white/5"
                          : "bg-gradient-to-t from-slate-900/10 via-transparent to-white/20"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {/* No backing panel / vignette — covers float directly over the
         * cinematic atmosphere. The mask-image above keeps a soft top falloff
         * only; the bottom row ends cleanly over the cinematic background. */}
      </div>

      <p
        className={`mt-5 text-center text-sm ${
          isDark ? "text-slate-400" : "text-slate-300"
        }`}
      >
        Your next favorite game is somewhere in here.
      </p>
    </div>
  );
}
