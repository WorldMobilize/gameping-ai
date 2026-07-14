"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Scroll-reveal wrapper. Adds `.gp-reveal-in` when the element enters the
 * viewport, driving a soft rise-and-fade (CSS in landing-motion.css). Under
 * prefers-reduced-motion the CSS renders it visible immediately, so this is a
 * pure enhancement. `delay` staggers siblings.
 *
 * `repeat` keeps the observer live so the entrance replays every time the
 * element leaves and re-enters the viewport (reactive), instead of firing once.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  className = "",
  delay = 0,
  repeat = false,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  repeat?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || (shown && !repeat)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (repeat) {
          // Reactive: track visibility both ways so the effect re-fires on re-entry.
          setShown(entry.isIntersecting);
        } else if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, repeat]);

  return (
    <Tag
      ref={ref}
      className={`gp-reveal ${shown ? "gp-reveal-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
