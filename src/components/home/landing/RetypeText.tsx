"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Like TypedText, but RE-TRIGGERS: it types out each time it enters the viewport
 * and resets when it leaves, so scrolling away and back replays the effect. The
 * full string stays in layout (transparent tail) so wrapping never shifts. Under
 * prefers-reduced-motion it just shows the full text.
 */
export default function RetypeText({
  text,
  className = "",
  speed = 55,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const timer = useRef(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer.current);
        if (!entry.isIntersecting) {
          setCount(0); // reset so it replays next time it enters
          return;
        }
        if (reduce) {
          setCount(text.length);
          return;
        }
        let i = 0;
        setCount(0);
        const tick = () => {
          i += 1;
          setCount(i);
          if (i < text.length) timer.current = window.setTimeout(tick, speed);
        };
        timer.current = window.setTimeout(tick, speed);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer.current);
    };
  }, [text, speed]);

  const done = count >= text.length;

  return (
    <span ref={ref} className={className}>
      {text.slice(0, count)}
      {!done ? (
        <span aria-hidden className="gp-caret font-normal text-blue-400/70" style={{ display: "inline-block", width: 0, overflow: "visible" }}>
          |
        </span>
      ) : null}
      <span aria-hidden style={{ opacity: 0 }}>{text.slice(count)}</span>
    </span>
  );
}
