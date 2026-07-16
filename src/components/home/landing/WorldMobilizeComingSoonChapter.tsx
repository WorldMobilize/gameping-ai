"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NAVY_CTA_LG } from "@/components/app/app-styles";

/**
 * WorldMobilize chapter — deliberately minimal while the product is pre-launch.
 * No description, no map (we don't spoil what it is): just the name dropping in
 * letter by letter, and a locked "Coming soon" CTA. Sits last among the feature
 * chapters. Presentation only.
 */

function FallingText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={ref} aria-label={text} className={`${shown ? "gp-drop-in" : ""} ${className}`}>
      {text.split("").map((ch, i) => (
        <span key={i} aria-hidden className="gp-drop-letter" style={{ animationDelay: `${i * 45}ms` }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export default function WorldMobilizeComingSoonChapter({
  heading,
  eyebrow,
  className = "",
}: {
  heading: string;
  eyebrow: string;
  className?: string;
}) {
  return (
    <section id="worldmobilize" className={`scroll-mt-[150px] py-24 sm:py-36 ${className}`}>
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className={`flex items-center justify-center gap-3 text-[13px] font-semibold uppercase tracking-[0.2em] ${eyebrow}`}>
          <span className="tabular-nums">03</span><span className="h-px w-8 bg-current opacity-40" aria-hidden />Coming soon
        </p>

        <h2 className={`gp-home-display mt-5 text-[2.6rem] font-semibold uppercase leading-[0.98] sm:text-[5rem] ${heading}`}>
          <FallingText text="WorldMobilize" />
        </h2>

        <div className="mt-9 flex justify-center">
          <Link href="/worldmobilize" className={`${NAVY_CTA_LG} inline-flex items-center gap-2`}>
            <LockIcon />
            Coming soon
          </Link>
        </div>
      </div>
    </section>
  );
}
