type PingOrbProps = {
  size?: number;
  className?: string;
  bars?: number;
  /** hero = larger core, more rings, radio arcs */
  variant?: "hero" | "default" | "compact";
};

/**
 * Ping — the game discovery companion, shown as a glowing signal orb.
 * Pure CSS/SVG: concentric signal rings, radio arcs, pulsing mint core,
 * and animated waveform bars. No robot/face/mascot. Respects reduced motion.
 */
export default function PingOrb({
  size = 160,
  className = "",
  bars = 5,
  variant = "default",
}: PingOrbProps) {
  const isHero = variant === "hero";
  const isCompact = variant === "compact";

  return (
    <div
      className={`gp-ping-orb ${isHero ? "gp-ping-orb-hero" : ""} ${isCompact ? "gp-ping-orb-compact" : ""} relative grid place-items-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="gp-ping-glow gp-ping-glow-outer" />
      <span className="gp-ping-glow gp-ping-glow-inner" />
      <span className="gp-ping-ring gp-ping-ring-1" />
      <span className="gp-ping-ring gp-ping-ring-2" />
      <span className="gp-ping-ring gp-ping-ring-3" />
      {isHero || variant === "default" ? (
        <>
          <span className="gp-ping-ring gp-ping-ring-4" />
          <svg className="gp-ping-signal" viewBox="0 0 200 200" fill="none">
            <path
              className="gp-ping-signal-arc gp-ping-signal-arc-1"
              d="M100 28 C 148 28, 172 52, 172 100"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              className="gp-ping-signal-arc gp-ping-signal-arc-2"
              d="M100 12 C 162 12, 188 38, 188 100"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              className="gp-ping-signal-arc gp-ping-signal-arc-3"
              d="M28 100 C 28 52, 52 28, 100 28"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </>
      ) : null}

      <div className="gp-ping-core">
        <div className="gp-ping-wave">
          {Array.from({ length: bars }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
