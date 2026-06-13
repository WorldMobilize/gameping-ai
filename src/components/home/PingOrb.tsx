type PingOrbProps = {
  size?: number;
  className?: string;
  bars?: number;
};

/**
 * Ping — the game discovery companion, shown as a glowing signal orb.
 * Pure CSS/SVG: concentric signal rings, a pulsing mint core, and a
 * small animated waveform. No robot/face/mascot. Respects reduced motion.
 */
export default function PingOrb({ size = 160, className = "", bars = 5 }: PingOrbProps) {
  return (
    <div
      className={`gp-ping-orb relative grid place-items-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="gp-ping-ring gp-ping-ring-1" />
      <span className="gp-ping-ring gp-ping-ring-2" />
      <span className="gp-ping-ring gp-ping-ring-3" />
      <span className="gp-ping-glow" />

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
