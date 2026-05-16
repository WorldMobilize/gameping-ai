"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GameScreenshotItem = {
  id: number;
  image: string;
};

type GameScreenshotLightboxProps = {
  screenshots: GameScreenshotItem[];
  gameTitle: string;
};

export default function GameScreenshotLightbox({
  screenshots,
  gameTitle,
}: GameScreenshotLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openTriggerRef = useRef<HTMLButtonElement | null>(null);

  const isOpen = activeIndex !== null;
  const count = screenshots.length;

  const close = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => {
      if (i === null || count === 0) return i;
      return (i - 1 + count) % count;
    });
  }, [count]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => {
      if (i === null || count === 0) return i;
      return (i + 1) % count;
    });
  }, [count]);

  const openAt = useCallback((index: number, trigger: HTMLButtonElement | null) => {
    openTriggerRef.current = trigger;
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      openTriggerRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close, goPrev, goNext]);

  if (count === 0) return null;

  const active = activeIndex !== null ? screenshots[activeIndex] : null;

  return (
    <>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {screenshots.map((shot, index) => (
          <button
            key={shot.id}
            type="button"
            onClick={(e) => openAt(index, e.currentTarget)}
            aria-label={`Open screenshot ${index + 1} of ${count}`}
            className={`group cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-black/20 text-left transition hover:border-cyan-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
              index === 0 ? "md:col-span-2 lg:col-span-2" : ""
            }`}
          >
            <img
              src={shot.image}
              alt={`${gameTitle} screenshot ${index + 1}`}
              className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {isOpen && active && activeIndex !== null ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={`${gameTitle} screenshot gallery`}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={close}
            aria-label="Close gallery"
          />

          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-[102] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-2xl font-light text-white transition hover:border-white/40 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 sm:right-6 sm:top-6"
            aria-label="Close gallery"
          >
            <span aria-hidden="true">×</span>
          </button>

          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-[102] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:border-white/40 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 sm:left-4 sm:h-14 sm:w-14"
            aria-label="Previous screenshot"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ‹
            </span>
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-[102] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:border-white/40 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 sm:right-4 sm:h-14 sm:w-14"
            aria-label="Next screenshot"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ›
            </span>
          </button>

          <div className="relative z-[101] flex max-h-[min(90vh,900px)] w-full max-w-[min(96vw,1200px)] flex-col items-center px-14 py-16 sm:px-20">
            <img
              src={active.image}
              alt={`${gameTitle} screenshot ${activeIndex + 1} of ${count}`}
              className="max-h-[min(78vh,820px)] w-full object-contain"
            />
            <p className="mt-4 text-sm font-semibold text-white/55">
              {activeIndex + 1} / {count}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
