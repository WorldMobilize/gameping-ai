import Image from "next/image";

/** Hero atmosphere — cyber city image with readability overlays. */
export default function HomeHeroAtmosphere() {
  return (
    <div className="gp-home-hero-bg pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="gp-home-hero-city-wrap">
        <Image
          src="/images/hero-cyber-city.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="gp-home-hero-city-image object-cover"
        />
      </div>

      <div className="gp-home-hero-city-dim" />
      <div className="gp-home-hero-atmosphere-glow" />
      <div className="gp-home-hero-atmosphere-scrim" />
      <div className="gp-home-hero-atmosphere-fog" />
    </div>
  );
}
