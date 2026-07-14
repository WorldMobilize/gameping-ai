"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import TypedText from "@/components/home/landing/TypedText";
import { steamPortraitImage } from "@/lib/curated/game-links";

/**
 * Companion preview — the overlay over a game.
 *
 * A game screenshot fills the panel (the "gameplay") and the Companion overlay
 * sits on top with its five modes (voice / video / image / music / text). Each
 * mode is a self-contained demo: its own game, its own question, its own answer
 * — including the media answers the Companion really returns (a clip, an image,
 * a track). Modes rotate on their own and can be clicked. Presentation only —
 * no Companion call, no data.
 *
 * The Companion does not read the screen, so no question here leans on one:
 * every prompt names its own game and subject, exactly as a player would have
 * to type or say it.
 */

type DemoMedia =
  | { kind: "video"; title: string; channel: string; duration: string; thumb: string }
  | { kind: "image"; caption: string; source: string; src: string | null }
  | { kind: "music"; title: string; artist: string; album: string; duration: string; cover: string }
  | null;

/** One step of a live speech transcript: what the recognizer thinks it heard. */
type VoiceFrame = { text: string; fixedIndex?: number };

type Demo = {
  key: string;
  label: string;
  icon: ReactNode;
  game: string;
  art: string;
  /** Committed question (typed out, or the final transcript in voice mode). */
  query: string;
  /** Voice mode only — interim transcripts, corrected as the recognizer settles. */
  voice?: VoiceFrame[];
  answer: string;
  media: DemoMedia;
};

/** Real RAWG screenshots — the same art each game shows on its detail page. */
const ART = {
  eldenRing: "https://media.rawg.io/media/screenshots/36f/36f941f72e2b2a41629f5fb3bd448688.jpg",
  witcher3: "https://media.rawg.io/media/screenshots/1ac/1ac19f31974314855ad7be266adeb500.jpg",
  witcher3Alt: "https://media.rawg.io/media/screenshots/6a0/6a08afca95261a2fe221ea9e01d28762.jpg",
  minecraft: "https://media.rawg.io/media/screenshots/324/32454b11adde40d87c046f310f0d710d.jpg",
  skyrim: "https://media.rawg.io/media/screenshots/3bd/3bd2710bd1ffb6664fdea7b83afd067e.jpg",
  sevenDays: "https://media.rawg.io/media/screenshots/b09/b091cf5400ac490b44055a073cc22f2c.jpg",
};

/** The crafting grid the image answer returns (3 cobblestone + 2 sticks → stone axe). */
const STONE_AXE_RECIPE: string | null = "/images/backgrounds/Stoneaxe.png";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const DEMOS: Demo[] = [
  {
    key: "voice",
    label: "Voice",
    icon: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
    game: "Elden Ring",
    art: ART.eldenRing,
    voice: [
      { text: "elden ring how do i" },
      { text: "elden ring how do i staple" },
      { text: "elden ring how do i stagger", fixedIndex: 5 },
      { text: "elden ring how do i stagger a shielded" },
      { text: "elden ring how do i stagger a shielded night" },
      { text: "elden ring how do i stagger a shielded knight", fixedIndex: 8 },
      { text: "elden ring how do i stagger a shielded knight my hits keep" },
    ],
    query: "Elden Ring — how do I stagger a shielded knight? My hits keep bouncing off.",
    answer:
      "Normal swings just chip a raised shield. Charged heavies and jump attacks build stance damage fast — two jumping heavies and the guard breaks, then land the critical. Never trade in front of the shield.",
    media: null,
  },
  {
    key: "video",
    label: "Video",
    icon: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></>,
    game: "The Witcher 3",
    art: ART.witcher3,
    query: "Witcher 3 — show me how to fight a Fiend, it keeps flooring me.",
    answer:
      "Fiends burn: Igni is your sign. Keep Quen up, dodge sideways out of the charge instead of rolling back, and look away when the third eye flares — that's the stun. The whole pattern, in two minutes:",
    media: {
      kind: "video",
      title: "Fiend — how to bait the charge and punish it",
      channel: "Witcher Combat Guides",
      duration: "2:41",
      thumb: ART.witcher3Alt,
    },
  },
  {
    key: "image",
    label: "Image",
    icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5-5-9 9" /></>,
    game: "Minecraft",
    art: ART.minecraft,
    query: "Minecraft — how do I craft a stone axe?",
    answer:
      "Three cobblestone and two sticks, on a crafting table (the 2×2 inventory grid is too small). Cobble in the top-left and top-middle slots, one more cobble below the top-left, then the two sticks straight down the middle column:",
    media: {
      kind: "image",
      caption: "Stone axe — crafting grid",
      source: "digminecraft.com",
      src: STONE_AXE_RECIPE,
    },
  },
  {
    key: "music",
    label: "Music",
    icon: <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
    game: "Skyrim",
    art: ART.skyrim,
    query: "Play the Skyrim track that kicks in when a dragon attacks.",
    answer:
      "That's “Dragonborn” — Jeremy Soule's main theme, the one with the Dovahzul choir. Queued up:",
    media: {
      kind: "music",
      title: "Dragonborn",
      artist: "Jeremy Soule",
      album: "Skyrim — Original Game Soundtrack",
      duration: "4:38",
      cover: steamPortraitImage(72850),
    },
  },
  {
    key: "text",
    label: "Text",
    icon: <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />,
    game: "7 Days to Die",
    art: ART.sevenDays,
    query: "7 Days to Die — can I take a Lumberjack with an iron pickaxe?",
    answer:
      "Not head-on. Lumberjacks have high HP and a charged swing that staggers you, and the pickaxe trades far too slowly — back up a slope, keep trees between you and land headshots. And if wolves are around, they're the ones to deal with first.",
    media: null,
  },
];

const TYPE_SPEED = 32;
const VOICE_FRAME_MS = 460;
const START_DELAY = 450;
const ANSWER_GAP = 380;
/**
 * How long a mode owns the overlay — question, answer and all. The progress bar
 * runs for exactly this long and IS the clock: the next mode takes over when the
 * bar reaches the far edge, never before. One timer, so the two can't drift.
 */
const MODE_MS = 10000;
/** Picking a mode by hand parks the rotation for a while, then it resumes. */
const RESUME_AFTER_MS = 12000;

/**
 * A live speech transcript: words land as the recognizer hears them, and a
 * mis-heard word is replaced once it settles ("night" → "knight"). The last
 * word of an interim frame reads as unconfirmed; a corrected word flashes.
 */
function VoiceTranscript({ frames, final }: { frames: VoiceFrame[]; final: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const id = window.setInterval(() => {
      setStep((s) => (s > frames.length ? s : s + 1));
    }, VOICE_FRAME_MS);
    return () => window.clearInterval(id);
  }, [frames]);

  if (step >= frames.length) {
    return <span className="text-slate-100">{final}</span>;
  }

  const frame = frames[step];
  const words = frame.text.split(" ");

  return (
    <span>
      {words.map((word, i) => {
        const fixed = frame.fixedIndex === i;
        const unconfirmed = !fixed && i === words.length - 1;
        return (
          <span
            key={`${word}-${i}`}
            className={
              fixed
                ? "text-blue-300"
                : unconfirmed
                  ? "text-slate-400 underline decoration-slate-500 decoration-dotted underline-offset-4"
                  : "text-slate-200"
            }
          >
            {word}
            {i < words.length - 1 ? " " : null}
          </span>
        );
      })}
      <span aria-hidden className="ml-1 inline-block h-3 w-px animate-pulse bg-blue-400 align-middle" />
    </span>
  );
}

function VideoAnswer({ media }: { media: Extract<DemoMedia, { kind: "video" }> }) {
  return (
    <div className="mt-3 flex gap-3 rounded-lg border border-white/10 bg-black/40 p-2">
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md sm:w-40">
        <Image src={media.thumb} alt="" fill sizes="160px" className="object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/25">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg">
            <svg className="ml-0.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
        <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 font-mono text-[9px] font-semibold text-white">
          {media.duration}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate text-[13px] font-semibold text-slate-100">{media.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-400">{media.channel}</p>
        <div aria-hidden className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/4 rounded-full bg-blue-400" />
        </div>
      </div>
    </div>
  );
}

/** Bar heights for the little waveform under the track. */
const WAVE = [5, 9, 14, 8, 17, 11, 6, 13, 9, 16, 7, 12, 5, 10, 15, 8, 6, 11, 9, 5];

function MusicAnswer({ media }: { media: Extract<DemoMedia, { kind: "music" }> }) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-2">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
        <Image src={media.cover} alt="" fill sizes="48px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-slate-100">
          {media.title} <span className="font-normal text-slate-400">— {media.artist}</span>
        </p>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{media.album}</p>
        <div aria-hidden className="mt-1.5 flex h-4 items-end gap-[3px]">
          {WAVE.map((h, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full ${i < 7 ? "bg-blue-400" : "bg-white/20"}`}
              style={{ height: `${h}px` }}
            />
          ))}
          <span className="ml-auto font-mono text-[10px] text-slate-500">1:12 / {media.duration}</span>
        </div>
      </div>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-500/20 text-blue-300">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
      </span>
    </div>
  );
}

function ImageAnswer({ media }: { media: Extract<DemoMedia, { kind: "image" }> }) {
  return (
    <figure className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/40">
      <div className="relative h-[200px] w-full overflow-hidden bg-[#070c17]">
        {media.src ? (
          /* A wiki graphic, not a photo: it needs its own light plate to read. */
          <div className="absolute inset-0 bg-slate-200 p-2.5">
            <Image src={media.src} alt={media.caption} fill sizes="240px" className="object-contain" />
          </div>
        ) : (
          /* Empty plate until STONE_AXE_RECIPE points at a real crafting image. */
          <div aria-hidden className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.14),transparent_65%)]">
            <svg className="h-7 w-7 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="M21 16l-5-5-9 9" />
            </svg>
          </div>
        )}
      </div>
      <figcaption className="flex items-center gap-2 border-t border-white/[0.07] px-3 py-1.5 text-[11px] text-slate-400">
        {media.caption}
        <span className="ml-auto shrink-0 text-slate-500">{media.source}</span>
      </figcaption>
    </figure>
  );
}

export default function CompanionOverlayDemo() {
  const ref = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);
  const [active, setActive] = useState(0);
  // 0 = overlay idle, 1 = asking, 2 = answered / overlay expanded
  const [phase, setPhase] = useState(0);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  /** Bumped on every hand-picked mode: parks the rotation, and re-parks it on a
   * second click. Back to 0 → the rotation has the wheel again. */
  const [pin, setPin] = useState(0);
  const [hovered, setHovered] = useState(false);
  const pinned = pin > 0;

  const demo = DEMOS[active];

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        // Leaving the section hands control back to the rotation.
        if (!entry.isIntersecting) setPin(0);
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // How long the question takes to land, so the answer never beats it on screen.
  const askMs = useMemo(
    () => (demo.voice ? demo.voice.length * VOICE_FRAME_MS + 400 : demo.query.length * TYPE_SPEED),
    [demo]
  );
  const answerAt = START_DELAY + askMs + ANSWER_GAP;

  // Asking → answering. Moving on to the next mode is the bar's job, not a timer's.
  useEffect(() => {
    const clear = () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
    clear();

    if (!inView) {
      setPhase(0);
      return;
    }
    if (reduced) {
      setPhase(2);
      return;
    }

    setPhase(0);
    timers.current.push(window.setTimeout(() => setPhase(1), START_DELAY));
    timers.current.push(window.setTimeout(() => setPhase(2), answerAt));
    return clear;
  }, [active, answerAt, demo, inView, reduced]);

  // A hand-picked mode keeps the floor for a while; then the bar starts running
  // again from where it froze, and the rotation carries on.
  useEffect(() => {
    if (!pin) return;
    const id = window.setTimeout(() => setPin(0), RESUME_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [pin]);

  // Hovering pauses the bar and a click parks it, so nobody loses the answer they
  // came to read. Either way the bar freezes in place and resumes where it was.
  const paused = pinned || hovered;

  const asking = phase >= 1;
  const answered = phase >= 2;

  return (
    <div ref={ref} className="relative w-full">
      <div aria-hidden className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-blue-500/[0.08] blur-3xl" />

      {/* The game screen. */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-[#05070d] shadow-[0_50px_120px_-40px_rgba(2,6,23,0.85)] ring-1 ring-white/[0.04]">
        <Image
          key={demo.key}
          src={demo.art}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 976px"
          className="gp-companion-art object-cover"
        />
        {/* darken for overlay legibility */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/60" />

        {/* faux game HUD corner, for context */}
        <div aria-hidden className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />In-game · {demo.game}
        </div>

        {/* The Companion overlay, expanding when answered. */}
        <div
          className="absolute left-1/2 top-6 w-[88%] max-w-[640px] -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f1a]/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-500 ease-out"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* modes — click one (it stays), or let them cycle */}
          <div className="relative flex items-center gap-1 border-b border-white/[0.07] px-3 py-2">
            {DEMOS.map((m, i) => {
              const isActive = i === active;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setPin((p) => p + 1);
                    setActive(i);
                  }}
                  aria-pressed={isActive}
                  title={`${m.label} — ${m.game}`}
                  className={`flex h-6 w-6 items-center justify-center rounded-md transition hover:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400/70 ${
                    isActive ? "bg-blue-500/20 text-blue-300" : "text-slate-500"
                  }`}
                >
                  <Glyph>{m.icon}</Glyph>
                  <span className="sr-only">{m.label}</span>
                </button>
              );
            })}

            {/* which mode you're watching, and on which game */}
            <span className="ml-2 hidden min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:block">
              {demo.label}
              <span className="text-slate-600"> · </span>
              <span className="text-slate-500">{demo.game}</span>
            </span>

            <span className="ml-auto shrink-0 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-400">Alt&nbsp;+&nbsp;G</span>

            {/* How long this mode has left — and the clock the rotation runs on:
             * the next mode takes over when this reaches the far edge, not a
             * millisecond earlier. Paused, it simply holds its ground. */}
            {!reduced && inView ? (
              <span
                key={`${active}-${pin}`}
                aria-hidden
                className="gp-companion-cycle absolute inset-x-0 bottom-0 h-px origin-left bg-blue-400/60"
                style={{ animationDuration: `${MODE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                onAnimationEnd={() => setActive((i) => (i + 1) % DEMOS.length)}
              />
            ) : null}
          </div>

          {/* the question */}
          <div className="px-4 py-3">
            <span className="flex items-baseline font-mono text-[13px] leading-relaxed text-slate-200">
              <span className={`mr-2 shrink-0 text-blue-400 ${demo.voice && asking ? "animate-pulse" : ""}`} aria-hidden>
                {demo.voice ? (
                  <Glyph><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Glyph>
                ) : (
                  "›"
                )}
              </span>
              <span className="min-w-0">
                {!asking ? (
                  <span className="text-slate-500">{demo.voice ? "Listening…" : "Ask anything…"}</span>
                ) : demo.voice ? (
                  <VoiceTranscript key={demo.key} frames={demo.voice} final={demo.query} />
                ) : (
                  <TypedText key={demo.key} text={demo.query} speed={TYPE_SPEED} />
                )}
              </span>
            </span>
          </div>

          {/* answer — the overlay grows to show it */}
          <div className={`grid transition-all duration-500 ease-out ${answered ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <div className="border-t border-white/[0.07] px-4 py-3.5">
                <p className="text-sm leading-relaxed text-slate-200">{demo.answer}</p>
                {demo.media?.kind === "video" ? <VideoAnswer media={demo.media} /> : null}
                {demo.media?.kind === "image" ? <ImageAnswer media={demo.media} /> : null}
                {demo.media?.kind === "music" ? <MusicAnswer media={demo.media} /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
