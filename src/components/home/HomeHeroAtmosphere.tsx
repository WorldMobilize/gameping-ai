/** Hero atmosphere — large soft pastel blobs + faint starfield (no city image). */
export default function HomeHeroAtmosphere() {
  return (
    <div className="gp-home-aura pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <span className="gp-home-blob gp-home-blob-mint" />
      <span className="gp-home-blob gp-home-blob-violet" />
      <span className="gp-home-blob gp-home-blob-coral" />
      <span className="gp-home-blob gp-home-blob-blue" />
      <span className="gp-home-blob gp-home-blob-panel" />
      <div className="gp-home-stars" />
      <div className="gp-home-aura-fade" />
    </div>
  );
}
