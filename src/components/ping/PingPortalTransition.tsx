"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "@/components/home/use-reduced-motion";
import PingAssistant from "@/components/ping/PingAssistant";

const PORTAL_DURATION_MS = 1200;
const PORTAL_REDUCED_MS = 450;

type PingPortalTransitionProps = {
  onComplete: () => void;
};

/** Fullscreen admin-only gateway before entering PING recommend mode. */
export default function PingPortalTransition({ onComplete }: PingPortalTransitionProps) {
  const reducedMotion = useReducedMotion();
  const [textStage, setTextStage] = useState(0);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const durationMs = reducedMotion ? PORTAL_REDUCED_MS : PORTAL_DURATION_MS;
  const stageSwitchMs = reducedMotion ? 180 : 500;

  useEffect(() => {
    const stageTimer = window.setTimeout(() => setTextStage(1), stageSwitchMs);
    const navTimer = window.setTimeout(() => onComplete(), durationMs);

    return () => {
      window.clearTimeout(stageTimer);
      window.clearTimeout(navTimer);
    };
  }, [durationMs, onComplete, stageSwitchMs]);

  const message =
    textStage === 0 ? "Opening gateway..." : "Entering your gaming universe...";

  if (!mounted) return null;

  return createPortal(
    <div
      className={`gp-ping-portal ${reducedMotion ? "gp-ping-portal-reduced" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="gp-ping-portal-backdrop" aria-hidden />

      <div className="gp-ping-portal-glow" aria-hidden />

      <div className="gp-ping-portal-rings" aria-hidden>
        <span className="gp-ping-portal-ring gp-ping-portal-ring-1" />
        <span className="gp-ping-portal-ring gp-ping-portal-ring-2" />
        <span className="gp-ping-portal-ring gp-ping-portal-ring-3" />
      </div>

      <div className="gp-ping-portal-particles" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="gp-ping-portal-particle"
            style={{ ["--particle-i" as string]: i }}
          />
        ))}
      </div>

      <div className="gp-ping-portal-core">
        <PingAssistant state="searching" size="hero" message={message} />
        <p className="gp-ping-portal-message sr-only">{message}</p>
      </div>
    </div>,
    document.body
  );
}
