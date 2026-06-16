type AtmosphereProps = {
  variant?: "hero" | "section";
};

const STARS = [
  { top: "8%", left: "6%", size: 14, delay: 0 },
  { top: "18%", left: "88%", size: 11, delay: 0.6 },
  { top: "34%", left: "72%", size: 9, delay: 1.2 },
  { top: "55%", left: "14%", size: 10, delay: 0.3 },
  { top: "68%", left: "58%", size: 8, delay: 1.8 },
  { top: "82%", left: "92%", size: 12, delay: 0.9 },
  { top: "44%", left: "38%", size: 7, delay: 2.2 },
  { top: "76%", left: "28%", size: 9, delay: 1.5 },
];

/** Rich pastel atmosphere — visible blobs, stars, soft depth. */
export default function HomePageAtmosphere({ variant = "hero" }: AtmosphereProps) {
  const isHero = variant === "hero";

  return (
    <div className={`gp-landing-aura ${isHero ? "gp-landing-aura-hero" : ""}`} aria-hidden>
      <span className="gp-landing-blob gp-landing-blob-mint" />
      <span className="gp-landing-blob gp-landing-blob-violet" />
      <span className="gp-landing-blob gp-landing-blob-coral" />
      {isHero ? (
        <>
          <span className="gp-landing-blob gp-landing-blob-amber" />
          <span className="gp-landing-blob gp-landing-blob-mint gp-landing-blob-secondary" />
          <span className="gp-landing-blob gp-landing-blob-violet gp-landing-blob-secondary" />
        </>
      ) : null}

      {STARS.map((star, i) => (
        <span
          key={i}
          className="gp-landing-star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      <span className="gp-landing-cloud gp-landing-cloud-lg" style={{ top: "12%", left: "58%" }} />
      <span className="gp-landing-cloud" style={{ bottom: "18%", left: "4%" }} />
      {isHero ? (
        <span className="gp-landing-cloud gp-landing-cloud-warm" style={{ top: "62%", right: "8%" }} />
      ) : null}
    </div>
  );
}
