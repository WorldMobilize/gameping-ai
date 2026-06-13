type AtmosphereProps = {
  /** Show fewer blobs for mid-page sections */
  variant?: "hero" | "section";
};

const STARS = [
  { top: "14%", left: "10%", size: 12, delay: 0 },
  { top: "28%", left: "78%", size: 10, delay: 0.8 },
  { top: "62%", left: "22%", size: 8, delay: 1.4 },
  { top: "72%", left: "88%", size: 9, delay: 2 },
  { top: "42%", left: "52%", size: 7, delay: 0.5 },
];

/** Pastel blobs, stars, and soft clouds — reference atmosphere. */
export default function HomePageAtmosphere({ variant = "hero" }: AtmosphereProps) {
  return (
    <div className="gp-landing-aura" aria-hidden>
      <span className="gp-landing-blob gp-landing-blob-mint" />
      <span className="gp-landing-blob gp-landing-blob-violet" />
      {variant === "hero" ? (
        <>
          <span className="gp-landing-blob gp-landing-blob-coral" />
          <span className="gp-landing-blob gp-landing-blob-amber" />
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

      <span
        className="gp-landing-cloud"
        style={{
          top: "20%",
          left: "65%",
          width: 100,
          height: 40,
          background: "radial-gradient(ellipse, rgba(196,181,253,0.45), transparent 70%)",
        }}
      />
      <span
        className="gp-landing-cloud"
        style={{
          bottom: "25%",
          left: "8%",
          width: 88,
          height: 36,
          background: "radial-gradient(ellipse, rgba(196,181,253,0.3), transparent 70%)",
        }}
      />
    </div>
  );
}
