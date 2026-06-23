"use client";

import { useId } from "react";

type AtmosphereVariant = "hero" | "how-it-works" | "why-gameping" | "coming-soon" | "section";

/**
 * Theme-aware inline-SVG background atmosphere — a CSS/SVG recreation of the
 * reference art (NOT an image asset): deep navy/near-black base with layered
 * dark glass polygon planes lit from above, soft top-down cyan light beams,
 * sparse cyan edge highlights, and a vignette. All colours come from CSS
 * variables (see .gp-atmo in home-light.css) so it adapts to dark/light. z-0,
 * behind content.
 *
 * One coherent world, hierarchy by composition (each lower section is softer
 * than the hero — fewer highlights, larger/lower-contrast planes):
 *   variant="hero"         → full, layered, cinematic, highest contrast
 *   variant="how-it-works" → glass planes set diagonally upper-left→lower-right,
 *                            one soft beam + one soft cyan edge
 *   variant="why-gameping" → same planes composed more centred/right
 *   variant="coming-soon"  → planes weighted lower-left / lower-right
 *   variant="section"      → generic soft continuation (base planes only)
 *
 * Every variant uses ONLY the hero's visual language — angular dark glass
 * polygon planes, cyan edge-highlight lines, soft top-down beams. No circles,
 * radar arcs or node graphics anywhere; lower sections differ from the hero
 * only in polygon placement and intensity (softer via .gp-atmo--section CSS).
 */
export default function HomeAtmosphere({ variant = "section" }: { variant?: AtmosphereVariant }) {
  const isHero = variant === "hero";
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${uid}-${name}`;

  return (
    <div
      aria-hidden
      className={`gp-atmo gp-atmo--${variant} ${isHero ? "gp-atmo--hero" : "gp-atmo--section"}`}
    >
      <svg className="gp-atmo-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          {/* Base: top-centre teal glow fading into deep navy */}
          <radialGradient id={id("glow")} cx="50%" cy="-8%" r="85%">
            <stop offset="0%" style={{ stopColor: "var(--atmo-glow-top)" }} />
            <stop offset="42%" style={{ stopColor: "var(--atmo-glow-mid)" }} />
            <stop offset="100%" style={{ stopColor: "var(--atmo-glow-bottom)" }} />
          </radialGradient>

          {/* Glass panel gradients — bright cyan lit edge → glass → shadow */}
          <linearGradient id={id("panelA")} x1="0%" y1="0%" x2="28%" y2="100%">
            <stop offset="0%" style={{ stopColor: "var(--atmo-panel-hi)" }} />
            <stop offset="4%" style={{ stopColor: "var(--atmo-panel-a)" }} />
            <stop offset="100%" style={{ stopColor: "var(--atmo-panel-shadow)" }} />
          </linearGradient>
          <linearGradient id={id("panelB")} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "var(--atmo-panel-b)" }} />
            <stop offset="100%" style={{ stopColor: "var(--atmo-panel-shadow)" }} />
          </linearGradient>
          <linearGradient id={id("panelC")} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "var(--atmo-panel-c)" }} />
            <stop offset="100%" style={{ stopColor: "var(--atmo-panel-shadow)" }} />
          </linearGradient>
          {/* Front translucent glass — catches the light, fades out */}
          <linearGradient id={id("panelFront")} x1="0%" y1="0%" x2="18%" y2="100%">
            <stop offset="0%" style={{ stopColor: "var(--atmo-panel-front)" }} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {/* Top-down light beam */}
          <linearGradient id={id("beam")} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "var(--atmo-beam-strong)" }} />
            <stop offset="55%" style={{ stopColor: "var(--atmo-beam-soft)" }} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          <radialGradient id={id("vignette")} cx="50%" cy="36%" r="80%">
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" style={{ stopColor: "var(--atmo-vignette)" }} />
          </radialGradient>

          <filter id={id("beamblur")} x="-60%" y="-20%" width="220%" height="150%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <filter id={id("softshadow")} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id={id("edgeblur")} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Top-down light base on EVERY section so the whole landing shares the
         * same "soft light from above on deep navy" foundation (per-section
         * intensity is set by the SVG opacity in home-light.css). */}
        <rect width="1440" height="900" fill={`url(#${id("glow")})`} />

        {/* Back + mid base planes — hero (full) and the generic section fallback.
         * A big dark diagonal crosses behind the centre/right; a second recedes
         * below the hero; navy mid planes layer on top. */}
        {isHero || variant === "section" ? (
          <>
            <polygon points="560,-80 1520,150 1520,900 470,540" fill={`url(#${id("panelC")})`} />
            <polygon points="-80,540 560,380 1040,980 -80,980" fill={`url(#${id("panelC")})`} />
            <polygon points="-80,20 700,-60 980,450 -80,730" fill={`url(#${id("panelB")})`} />
            <polygon points="740,300 1520,430 1520,980 620,980" fill={`url(#${id("panelB")})`} />
          </>
        ) : null}

        {isHero ? (
          <>
            {/* Soft shadow pocket → depth beneath the central plane */}
            <polygon
              points="660,330 1300,470 1160,820 740,660"
              style={{ fill: "var(--atmo-shadow)" }}
              filter={`url(#${id("softshadow")})`}
            />

            {/* Angular plane lit from above — cyan only along its top edge
             * (panelA gradient), the body is dark navy */}
            <polygon points="560,-80 1520,150 1520,560 700,330" fill={`url(#${id("panelA")})`} />

            {/* Sparse front glass catching the top light, then fading out */}
            <polygon points="660,300 1300,440 1180,800 740,640" fill={`url(#${id("panelFront")})`} />
            <polygon points="900,250 1320,360 1220,580 860,470" fill={`url(#${id("panelFront")})`} />

            {/* Darker underside plane → grounds the base in shadow (depth) */}
            <polygon points="-80,730 1520,610 1520,980 -80,980" style={{ fill: "var(--atmo-shadow)" }} />

            {/* Soft volumetric top-down beams — light sources, not the base */}
            <g className="gp-atmo-beams" filter={`url(#${id("beamblur")})`}>
              <polygon points="560,-90 660,-90 470,840 250,840" fill={`url(#${id("beam")})`} />
              <polygon points="640,-90 720,-90 560,840 360,840" fill={`url(#${id("beam")})`} />
              <polygon points="700,-90 800,-90 840,840 620,840" fill={`url(#${id("beam")})`} />
              <polygon points="780,-90 840,-90 980,840 800,840" fill={`url(#${id("beam")})`} />
            </g>

            {/* Cyan edge light — only on selected plane edges: soft glow under
             * a sharp bright core */}
            <g className="gp-atmo-edges">
              <g filter={`url(#${id("edgeblur")})`}>
                <line x1="740" y1="640" x2="1300" y2="440" style={{ stroke: "var(--atmo-edge)" }} strokeWidth="2.6" />
                <line x1="700" y1="330" x2="1520" y2="150" style={{ stroke: "var(--atmo-edge)" }} strokeWidth="2.2" />
                <line x1="-40" y1="600" x2="470" y2="470" style={{ stroke: "var(--atmo-edge-2)" }} strokeWidth="1.8" />
              </g>
              <line x1="740" y1="640" x2="1300" y2="440" style={{ stroke: "var(--atmo-edge-core)" }} strokeWidth="1" />
              <line x1="700" y1="330" x2="1520" y2="150" style={{ stroke: "var(--atmo-edge-core)" }} strokeWidth="0.8" />
            </g>
          </>
        ) : null}

        {/* HOW IT WORKS — "input / analysis": glass planes converge toward the
         * centred prompt mockup; one soft beam + one soft cyan edge behind it. */}
        {variant === "how-it-works" ? (
          <>
            <polygon points="-80,-80 880,-80 540,980 -80,980" fill={`url(#${id("panelB")})`} />
            <polygon points="660,200 1520,340 1520,980 800,980" fill={`url(#${id("panelC")})`} />
            <polygon points="360,120 1180,40 1000,640 320,720" fill={`url(#${id("panelB")})`} />
            <polygon points="480,220 1080,300 980,640 460,560" fill={`url(#${id("panelFront")})`} />

            <g className="gp-atmo-beams" filter={`url(#${id("beamblur")})`}>
              <polygon points="620,-90 780,-90 720,840 480,840" fill={`url(#${id("beam")})`} />
            </g>

            <g className="gp-atmo-edges">
              <g filter={`url(#${id("edgeblur")})`}>
                <line x1="480" y1="220" x2="1080" y2="300" style={{ stroke: "var(--atmo-edge)" }} strokeWidth="2.2" />
              </g>
              <line x1="480" y1="220" x2="1080" y2="300" style={{ stroke: "var(--atmo-edge-core)" }} strokeWidth="0.7" />
            </g>
          </>
        ) : null}

        {/* WHY GAMEPING — same hero glass-plane language, composed more
         * centred/right. Overlapping dark angular planes, one front glass
         * plane catching the top light, a single soft beam and one soft cyan
         * edge highlight. No circles / radar / nodes. */}
        {variant === "why-gameping" ? (
          <>
            <polygon points="480,-80 1520,120 1520,820 560,560" fill={`url(#${id("panelC")})`} />
            <polygon points="-80,120 520,-40 900,560 -80,860" fill={`url(#${id("panelB")})`} />
            <polygon points="340,360 1180,520 980,980 300,860" fill={`url(#${id("panelB")})`} />
            <polygon points="620,160 1340,300 1180,720 560,580" fill={`url(#${id("panelFront")})`} />

            <g className="gp-atmo-beams" filter={`url(#${id("beamblur")})`}>
              <polygon points="720,-90 880,-90 820,840 580,840" fill={`url(#${id("beam")})`} />
            </g>

            <g className="gp-atmo-edges">
              <g filter={`url(#${id("edgeblur")})`}>
                <line x1="620" y1="160" x2="1340" y2="300" style={{ stroke: "var(--atmo-edge)" }} strokeWidth="1.8" />
              </g>
              <line x1="620" y1="160" x2="1340" y2="300" style={{ stroke: "var(--atmo-edge-core)" }} strokeWidth="0.6" />
            </g>
          </>
        ) : null}

        {/* COMING SOON — "future roadmap": darker receding planes converging to a
         * horizon, soft perspective floor, a couple of soft cyan/mint edges. */}
        {variant === "coming-soon" ? (
          <>
            <polygon points="-80,-80 700,-80 580,980 -80,980" fill={`url(#${id("panelC")})`} />
            <polygon points="740,-80 1520,-80 1520,980 860,980" fill={`url(#${id("panelC")})`} />
            <polygon points="-80,560 1520,560 1020,980 420,980" fill={`url(#${id("panelB")})`} />
            <polygon points="520,170 920,170 1060,640 380,640" fill={`url(#${id("panelFront")})`} />

            <g className="gp-atmo-beams" filter={`url(#${id("beamblur")})`}>
              <polygon points="640,-90 800,-90 760,720 540,720" fill={`url(#${id("beam")})`} />
            </g>

            <g className="gp-atmo-edges">
              <g filter={`url(#${id("edgeblur")})`}>
                <line x1="580" y1="980" x2="720" y2="170" style={{ stroke: "var(--atmo-edge)" }} strokeWidth="1.6" />
                <line x1="1020" y1="980" x2="720" y2="170" style={{ stroke: "var(--atmo-edge-2)" }} strokeWidth="1.4" />
              </g>
            </g>
          </>
        ) : null}

        <rect width="1440" height="900" fill={`url(#${id("vignette")})`} />
      </svg>
    </div>
  );
}
