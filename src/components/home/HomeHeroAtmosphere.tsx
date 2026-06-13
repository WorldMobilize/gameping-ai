/** Hero atmosphere — colorful blurred blobs + sparkle stars (reference style). */
export default function HomeHeroAtmosphere() {
  const sparkles = [
    { top: "12%", left: "8%", tone: "violet", size: 14 },
    { top: "22%", left: "72%", tone: "mint", size: 12 },
    { top: "58%", left: "18%", tone: "coral", size: 10 },
    { top: "68%", left: "82%", tone: "amber", size: 11 },
    { top: "38%", left: "48%", tone: "white", size: 8 },
    { top: "78%", left: "55%", tone: "violet", size: 9 },
    { top: "8%", left: "42%", tone: "mint", size: 10 },
  ];

  return (
    <div className="gp-home-aura pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <span className="gp-home-blob gp-home-blob-mint" />
      <span className="gp-home-blob gp-home-blob-violet" />
      <span className="gp-home-blob gp-home-blob-coral" />
      <span className="gp-home-blob gp-home-blob-blue" />
      <span className="gp-home-blob gp-home-blob-amber" />
      <span className="gp-home-blob gp-home-blob-panel" />
      <span className="gp-home-cloud gp-home-cloud-a" />
      <span className="gp-home-cloud gp-home-cloud-b" />

      {sparkles.map((s, i) => (
        <span
          key={i}
          className={`gp-home-sparkle gp-sparkle-${s.tone}`}
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}

      <div className="gp-home-stars" />
      <div className="gp-home-aura-fade" />
    </div>
  );
}
