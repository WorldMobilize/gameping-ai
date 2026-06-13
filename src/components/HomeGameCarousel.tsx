"use client";

import Link from "next/link";
import CuratedGameArt from "@/components/CuratedGameArt";
import { useSyncExternalStore, type CSSProperties } from "react";
import { gameDetailPath } from "@/lib/curated/game-links";
import { HOME_CAROUSEL_POOL, type HomeGamePick } from "@/lib/curated/home-picks";

const CAROUSEL_SEED_KEY = "gp-home-carousel-seed";

type CarouselSessionState = {
  picks: HomeGamePick[];
  trackStyle: CSSProperties;
};

const DEFAULT_CAROUSEL_STATE: CarouselSessionState = buildCarouselSessionStateWithSeed(0);

const carouselSessionStore = {
  state: null as CarouselSessionState | null,
  listeners: new Set<() => void>(),
};

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), state | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shufflePicks(items: HomeGamePick[], seed: number): HomeGamePick[] {
  const out = [...items];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function getOrCreateCarouselSeed(): number {
  const existing = sessionStorage.getItem(CAROUSEL_SEED_KEY);
  if (existing) {
    const parsed = Number(existing);
    if (Number.isFinite(parsed)) return parsed >>> 0;
  }
  const seed = Math.floor(Math.random() * 0x7fffffff);
  sessionStorage.setItem(CAROUSEL_SEED_KEY, String(seed));
  return seed;
}

function rotatePicks(items: HomeGamePick[], offset: number): HomeGamePick[] {
  if (items.length === 0) return items;
  const start = offset % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

/** Two independent shuffles so the loop seam (A→B) differs from the mid-strip rhythm. */
function buildEndlessCarouselTrack(pool: HomeGamePick[], seed: number): HomeGamePick[] {
  const segmentA = rotatePicks(shufflePicks(pool, seed), seed % pool.length);
  const segmentB = rotatePicks(
    shufflePicks(pool, (seed ^ 0x9e3779b9) >>> 0),
    (seed * 7 + 13) % pool.length
  );
  return [...segmentA, ...segmentB, ...segmentA, ...segmentB];
}

function buildCarouselSessionStateWithSeed(seed: number): CarouselSessionState {
  const pool = HOME_CAROUSEL_POOL;
  const durationSec = Math.round(52 + pool.length * 2.75) + (seed % 18);
  const delaySec = (seed % 41) + (seed % 7) * 0.4;
  return {
    picks: buildEndlessCarouselTrack(pool, seed),
    trackStyle: {
      ["--home-carousel-duration" as string]: `${durationSec}s`,
      animationDelay: `-${delaySec}s`,
    },
  };
}

function buildCarouselSessionState(): CarouselSessionState {
  return buildCarouselSessionStateWithSeed(getOrCreateCarouselSeed());
}

function subscribeCarouselSession(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  carouselSessionStore.listeners.add(onStoreChange);

  if (!carouselSessionStore.state) {
    queueMicrotask(() => {
      if (!carouselSessionStore.state) {
        carouselSessionStore.state = buildCarouselSessionState();
        carouselSessionStore.listeners.forEach((listener) => listener());
      }
    });
  }

  return () => {
    carouselSessionStore.listeners.delete(onStoreChange);
  };
}

function getCarouselSessionSnapshot(): CarouselSessionState {
  if (typeof window === "undefined") return DEFAULT_CAROUSEL_STATE;
  return carouselSessionStore.state ?? DEFAULT_CAROUSEL_STATE;
}

function getCarouselSessionServerSnapshot(): CarouselSessionState {
  return DEFAULT_CAROUSEL_STATE;
}

export default function HomeGameCarousel() {
  const { picks: carouselPicks, trackStyle } = useSyncExternalStore(
    subscribeCarouselSession,
    getCarouselSessionSnapshot,
    getCarouselSessionServerSnapshot
  );

  const loop = carouselPicks;

  return (
    <section className="gp-landing-section relative py-14 md:py-20" aria-labelledby="home-game-carousel-heading">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-20 gp-landing-carousel-fade md:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-20 bg-gradient-to-l from-[var(--gp-bg)] via-[var(--gp-bg)]/85 to-transparent md:w-28" />

      <div className="relative z-[2] mx-auto max-w-[var(--gp-max)] px-5 md:px-8">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="gp-landing-kicker">Explore</p>
            <h2 id="home-game-carousel-heading" className="gp-landing-h2 mt-2 text-2xl md:text-3xl">
              Games worth discovering
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/48 md:text-right">
            Hover to pause · scroll on mobile
          </p>
        </div>
      </div>

      <div className="home-carousel-viewport relative z-[2] w-full">
        <div className="home-carousel-track px-5 md:px-8" style={trackStyle}>
          {loop.map((game, index) => (
            <article
              key={`${game.title}-${index}`}
              className="gp-landing-carousel-card group relative w-[min(260px,76vw)] shrink-0 overflow-hidden motion-reduce:hover:translate-y-0"
            >
              <CuratedGameArt
                src={game.image}
                alt={`${game.title} header art`}
                sizes="(max-width: 768px) 78vw, 280px"
                variant="carousel"
                priority={index < 6}
                loading={index < 8 ? undefined : "lazy"}
              />

              <div className="space-y-3 p-4 pt-3">
                <div>
                  <h3 className="text-base font-semibold leading-tight">{game.title}</h3>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
                    {game.tag}
                  </p>
                </div>

                <Link
                  href={gameDetailPath(game.title)}
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.04] py-2 text-sm font-medium text-white/72 transition group-hover:border-teal-400/28 group-hover:bg-teal-400/10 group-hover:text-teal-100"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
