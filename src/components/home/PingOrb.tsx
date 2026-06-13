type PingOrbProps = {
  size?: number;
  className?: string;
  bars?: number;
  /** showcase = large hero with horizontal waveform + energy rings */
  variant?: "showcase" | "hero" | "default" | "compact";
};

const SHOWCASE_BARS = 24;

/**
 * Ping — digital discovery companion as a glowing signal entity.
 * Showcase variant: large core, horizontal waveform, energy rings, soft glow.
 * No face, robot, or mascot. CSS/SVG only.
 */
export default function PingOrb({
  size = 160,
  className = "",
  bars = 5,
  variant = "default",
}: PingOrbProps) {
  const isShowcase = variant === "showcase";
  const isHero = variant === "hero" || isShowcase;
  const isCompact = variant === "compact";

  if (isShowcase) {
    return (
      <div
        className={`gp-ping-showcase relative ${className}`}
        style={{ width: size, height: size * 0.72 }}
        aria-hidden
      >
        <span className="gp-ping-showcase-glow" />
        <svg className="gp-ping-showcase-rings" viewBox="0 0 320 220" fill="none">
          <circle cx="160" cy="110" r="95" className="gp-ping-static-ring gp-ping-static-ring-1" />
          <circle cx="160" cy="110" r="72" className="gp-ping-static-ring gp-ping-static-ring-2" />
          <circle cx="160" cy="110" r="50" className="gp-ping-static-ring gp-ping-static-ring-3" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const cx = 160 + Math.cos(rad) * 72;
            const cy = 110 + Math.sin(rad) * 72;
            return (
              <circle
                key={deg}
                cx={cx}
                cy={cy}
                r="2.5"
                className="gp-ping-ring-dot"
              />
            );
          })}
        </svg>

        <div className="gp-ping-showcase-wave-wrap">
          <div className="gp-ping-showcase-wave">
            {Array.from({ length: SHOWCASE_BARS }).map((_, i) => (
              <span
                key={i}
                className="gp-ping-showcase-bar"
                style={{ animationDelay: `${(i % 12) * 0.08}s` }}
              />
            ))}
          </div>
        </div>

        <div className="gp-ping-showcase-core">
          <div className="gp-ping-showcase-core-inner" />
        </div>
      </div>
    );
  }

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
