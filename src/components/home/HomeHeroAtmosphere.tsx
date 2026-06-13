/** Decorative hero background — original abstract skyline, no game assets. */
export default function HomeHeroAtmosphere() {
  return (
    <div className="gp-home-hero-bg pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="gp-home-hero-atmosphere-glow" />
      <div className="gp-home-hero-atmosphere-grid" />
      <div className="gp-home-hero-atmosphere-traces" />

      <svg
        className="gp-home-hero-skyline absolute bottom-0 left-0 h-[42%] w-full min-h-[200px] max-h-[320px] opacity-[0.55]"
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <defs>
          <linearGradient id="gp-skyline-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1424" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#05060f" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="gp-neon-window" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          fill="url(#gp-skyline-fill)"
          d="M0 320V220h60V140h40v80h50V90h35v130h45V160h55V70h40v190h60V110h70v210h55V180h48v140h52V95h38v225h58V150h42v170h65V85h45v235h72V200h50v120h68V130h44v190h80V320H0z"
        />
        <path
          fill="url(#gp-skyline-fill)"
          opacity="0.85"
          d="M720 320V190h55V120h38v70h62V80h42v110h58V150h40v170h70V100h48v220h65V175h52v145h88V320H720z"
        />
        <path
          fill="url(#gp-skyline-fill)"
          opacity="0.7"
          d="M1080 320V240h45V160h35v80h50V130h40v110h55V200h38v120h60V150h42v170h72V320h-437z"
        />
        <rect x="92" y="118" width="28" height="2" fill="url(#gp-neon-window)" opacity="0.6" />
        <rect x="248" y="98" width="36" height="2" fill="url(#gp-neon-window)" opacity="0.45" />
        <rect x="410" y="128" width="24" height="2" fill="url(#gp-neon-window)" opacity="0.5" />
        <rect x="798" y="108" width="32" height="2" fill="url(#gp-neon-window)" opacity="0.55" />
        <rect x="1150" y="178" width="40" height="2" fill="url(#gp-neon-window)" opacity="0.4" />
        <rect x="1260" y="168" width="22" height="2" fill="#a78bfa" opacity="0.25" />
      </svg>

      <div className="gp-home-hero-atmosphere-fog" />

      <span className="gp-home-hero-particle gp-home-hero-particle-1" />
      <span className="gp-home-hero-particle gp-home-hero-particle-2" />
      <span className="gp-home-hero-particle gp-home-hero-particle-3" />
      <span className="gp-home-hero-particle gp-home-hero-particle-4" />
      <span className="gp-home-hero-particle gp-home-hero-particle-5" />
    </div>
  );
}
