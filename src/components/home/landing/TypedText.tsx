"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Types `text` out character-by-character the first time it enters the
 * viewport, with a blinking caret. The full string is always in the layout
 * (the untyped tail is rendered transparent) so wrapping never changes — no
 * reflow / line jump while typing. The caret is zero-width so it can't push a
 * word to the next line. Under prefers-reduced-motion it shows the full text
 * immediately.
 */
export default function TypedText({
  text,
  className = "",
  speed = 34,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setCount(text.length);
          setDone(true);
          return;
        }

        let i = 0;
        let timer = 0;
        const tick = () => {
          i += 1;
          setCount(i);
          if (i < text.length) {
            timer = window.setTimeout(tick, speed);
          } else {
            setDone(true);
          }
        };
        timer = window.setTimeout(tick, speed);
        return () => window.clearTimeout(timer);
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [text, speed]);

  const shown = text.slice(0, count);
  const rest = text.slice(count);

  return (
    <span ref={ref} className={className}>
      {shown}
      {!done ? (
        <span
          aria-hidden
          className="gp-caret font-normal text-slate-400 dark:text-slate-500"
          style={{ display: "inline-block", width: 0, overflow: "visible" }}
        >
          |
        </span>
      ) : null}
      {/* Transparent tail keeps the final line-wrapping fixed from the start. */}
      <span aria-hidden style={{ opacity: 0 }}>
        {rest}
      </span>
    </span>
  );
}
