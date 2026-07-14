/**
 * Hero backdrop — a world seen from space, lit from the left, rendered in pure
 * CSS so it stays crisp and cheap. Sits low so it never covers the headline;
 * a faint starfield + atmosphere halo complete the "from orbit" feel. Semi-
 * transparent and aria-hidden — presentation only.
 */
export default function SpacePlanet() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* deep-space wash + a hint of light from the upper-left */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 760px at 22% 8%, rgba(96,165,250,0.14), transparent 55%), radial-gradient(1000px 900px at 50% 120%, rgba(30,58,138,0.18), transparent 60%)",
        }}
      />

      {/* faint starfield */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(1.4px 1.4px at 12% 22%, rgba(255,255,255,0.7), transparent), radial-gradient(1.2px 1.2px at 78% 14%, rgba(255,255,255,0.55), transparent), radial-gradient(1px 1px at 34% 40%, rgba(255,255,255,0.5), transparent), radial-gradient(1.3px 1.3px at 64% 30%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 88% 44%, rgba(255,255,255,0.45), transparent), radial-gradient(1.1px 1.1px at 24% 60%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 54% 8%, rgba(255,255,255,0.5), transparent)",
        }}
      />

      {/* atmospheric halo — brighter on the lit (left) side */}
      <div
        className="absolute left-1/2 top-[58%] h-[1300px] w-[1300px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 34% 30%, rgba(147,197,253,0.30), rgba(59,130,246,0.14) 30%, transparent 62%)",
          filter: "blur(10px)",
        }}
      />

      {/* the planet body — lit from the upper-left, terminator falling to the right */}
      <div
        className="absolute left-1/2 top-[60%] h-[1180px] w-[1180px] -translate-x-1/2 rounded-full opacity-90"
        style={{
          background:
            "radial-gradient(circle at 30% 28%, rgba(199,222,255,0.55) 0%, rgba(96,165,250,0.34) 22%, rgba(37,99,235,0.18) 42%, rgba(15,23,42,0.35) 60%, rgba(2,6,23,0.6) 76%)",
          boxShadow:
            "inset 60px 26px 150px -10px rgba(199,222,255,0.28), inset -70px -34px 170px rgba(2,6,23,0.62)",
        }}
      />

      {/* soft top vignette keeps the headline area clean */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--gp-bg-base) 0%, transparent 22%, transparent 88%, var(--gp-bg-base) 100%)",
        }}
      />
    </div>
  );
}
