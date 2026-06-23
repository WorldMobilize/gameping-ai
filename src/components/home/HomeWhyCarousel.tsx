"use client";

import { useEffect, useState } from "react";
import { HOME_WHY_CAROUSEL } from "@/components/home/home-demo-data";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import {
  HOME_BLOCK_BODY,
  HOME_BLOCK_TITLE,
  homeCyanAccentText,
} from "@/components/home/home-styles";

const ROTATE_MS = 4200;
const CARDS = HOME_WHY_CAROUSEL;
const COUNT = CARDS.length;

/** Highlight the `accent` substring of a title in cyan (premium, subtle). */
function CardTitle({
  title,
  accent,
  isDark,
}: {
  title: string;
  accent: string;
  isDark: boolean;
}) {
  const accentClass = homeCyanAccentText(isDark);
  const idx = title.indexOf(accent);
  if (idx === -1) {
    return <span className={accentClass}>{title}</span>;
  }
  return (
    <>
      {title.slice(0, idx)}
      <span className={accentClass}>{accent}</span>
      {title.slice(idx + accent.length)}
    </>
  );
}

type Slot = {
  rel: number;
  transform: string;
  opacity: number;
  zIndex: number;
  filter: string;
  visible: boolean;
};

/** Map a card index to its place in the 3-visible stack relative to `active`. */
function slotFor(index: number, active: number): Slot {
  let rel = ((index - active) % COUNT + COUNT) % COUNT;
  if (rel > COUNT / 2) rel -= COUNT; // wrap to {-2,-1,0,1,2}
  const abs = Math.abs(rel);
  const scale = rel === 0 ? 1 : abs === 1 ? 0.84 : 0.68;
  const shift = rel * 60; // % of card width — side cards peek behind center
  return {
    rel,
    transform: `translate(calc(-50% + ${shift}%), -50%) scale(${scale})`,
    opacity: rel === 0 ? 1 : abs === 1 ? 0.42 : 0,
    zIndex: 30 - abs * 10,
    filter: rel === 0 ? "none" : abs === 1 ? "blur(0.3px)" : "blur(2px)",
    visible: abs <= 2,
  };
}

export default function HomeWhyCarousel() {
  const { theme } = useHomeTheme();
  const isDark = theme === "dark";
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  // Respect prefers-reduced-motion: no auto-rotation, no card transitions.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % COUNT);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  const title = isDark ? "text-slate-50" : "text-slate-900";
  // Card descriptions are real explanatory copy — keep them comfortably readable
  // on both the dark glass and light frosted cards rather than faint.
  const body = isDark ? "text-slate-300" : "text-slate-700";

  // Light mode = frosted "holographic" glass over the dark room; dark unchanged.
  // Side (non-active) cards are kept lighter so the blurred ones peeking behind
  // the center don't pool into a dark halo/stain on the cinematic background.
  const cardBase = isDark
    ? "border-white/10 bg-slate-900/45"
    : "border-cyan-400/30 bg-[rgba(240,248,255,0.78)]";
  // Active emphasis comes from the brighter glass + cyan border; the shadow is a
  // small downward elevation only — no large all-around halo/stain underneath.
  const cardActive = isDark
    ? "border-cyan-400/40 bg-slate-900/75 shadow-[0_6px_16px_-12px_rgba(34,211,238,0.3)]"
    : "border-cyan-400/50 bg-[rgba(240,248,255,0.88)] shadow-[0_6px_16px_-12px_rgba(34,211,238,0.25)]";

  const transition = reduced
    ? ""
    : "transition-[transform,opacity,filter] duration-700 ease-out";

  return (
    <div className="mt-14">
      <div className="relative mx-auto h-[19rem] max-w-3xl overflow-hidden sm:h-[18rem]">
        {CARDS.map((card, i) => {
          const slot = slotFor(i, active);
          const isCenter = slot.rel === 0;
          return (
            <div
              key={card.id}
              className={`absolute left-1/2 top-1/2 w-[17.5rem] sm:w-[20rem] ${transition}`}
              style={{
                transform: slot.transform,
                opacity: slot.opacity,
                zIndex: slot.zIndex,
                filter: slot.filter,
                pointerEvents: isCenter ? "auto" : "none",
                visibility: slot.visible ? "visible" : "hidden",
              }}
              aria-hidden={!isCenter}
            >
              <article
                className={`flex h-[16rem] w-full flex-col items-center justify-center rounded-3xl border p-7 text-center backdrop-blur-md sm:h-[15.5rem] ${
                  isCenter ? cardActive : cardBase
                }`}
              >
                <h3 className={`${HOME_BLOCK_TITLE} ${title}`}>
                  <CardTitle title={card.title} accent={card.accent} isDark={isDark} />
                </h3>
                <p className={`${HOME_BLOCK_BODY} max-w-xs ${body}`}>{card.detail}</p>
              </article>
            </div>
          );
        })}
      </div>

      {/* Indicators — also let users jump to a card directly. */}
      <div className="mt-9 flex justify-center gap-2.5">
        {CARDS.map((card, i) => {
          const isCenter = i === active;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show "${card.title}"`}
              aria-current={isCenter}
              className={`h-2 rounded-full transition-all duration-500 ${
                isCenter
                  ? "w-7 bg-cyan-400"
                  : isDark
                    ? "w-2 bg-slate-600 hover:bg-slate-500"
                    : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
