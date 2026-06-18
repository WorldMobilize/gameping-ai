/**
 * Side-view ocean current ribbons for /upgrade — UI only.
 * Horizontal sine curves flowing left → right.
 */

type CurrentRibbonProps = {
  id: string;
  path: string;
  className: string;
  strokeWidth: number;
};

function CurrentRibbon({ id, path, className, strokeWidth }: CurrentRibbonProps) {
  const glowWidth = strokeWidth + 14;
  const shadowWidth = strokeWidth + 6;
  const highlightWidth = Math.max(2, strokeWidth * 0.22);

  return (
    <div className={`gp-upgrade-current ${className}`}>
      <svg viewBox="0 0 1600 200" preserveAspectRatio="none" className="gp-upgrade-current-svg">
        <defs>
          <linearGradient id={`${id}-flow`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="8%" stopColor="#22d3ee" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.62" />
            <stop offset="92%" stopColor="#38bdf8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={`${id}-shadow`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0c1a3a" stopOpacity="0" />
            <stop offset="12%" stopColor="#0c1a3a" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#020617" stopOpacity="0.38" />
            <stop offset="88%" stopColor="#0c1a3a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0c1a3a" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={`${id}-highlight`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ecfeff" stopOpacity="0" />
            <stop offset="10%" stopColor="#ecfeff" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#f0f9ff" stopOpacity="0.82" />
            <stop offset="90%" stopColor="#ecfeff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ecfeff" stopOpacity="0" />
          </linearGradient>

          <filter id={`${id}-glow`} x="-40%" y="-80%" width="180%" height="260%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <g className="gp-upgrade-current-inner">
          <path
            d={path}
            fill="none"
            stroke={`url(#${id}-shadow)`}
            strokeWidth={shadowWidth}
            strokeLinecap="round"
            opacity="0.32"
            transform="translate(0 7)"
          />
          <path
            d={path}
            fill="none"
            stroke={`url(#${id}-flow)`}
            strokeWidth={glowWidth}
            strokeLinecap="round"
            filter={`url(#${id}-glow)`}
            opacity="0.38"
          />
          <path
            d={path}
            fill="none"
            stroke={`url(#${id}-flow)`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.58"
          />
          <path
            d={path}
            fill="none"
            stroke={`url(#${id}-highlight)`}
            strokeWidth={highlightWidth}
            strokeLinecap="round"
            opacity="0.62"
            transform="translate(0 -4)"
          />
        </g>
      </svg>
    </div>
  );
}

/* Upper area — hero */
const CURRENT_1 =
  "M-260 108 C -60 82, 140 138, 340 102 S 740 72, 1140 96 S 1540 122, 1860 92";

/* Upper area — pricing cards */
const CURRENT_2 =
  "M-280 118 C -80 88, 160 158, 400 118 S 820 82, 1240 108 S 1640 138, 1880 102";

/* Upper area — lower pricing */
const CURRENT_3 =
  "M-240 128 C -40 98, 200 168, 460 128 S 880 92, 1280 118 S 1680 148, 1860 118";

/* Lower area — Steam */
const CURRENT_4 =
  "M-250 112 C -50 86, 180 148, 440 112 S 860 78, 1260 104 S 1660 132, 1870 98";

/* Lower area — FAQ */
const CURRENT_5 =
  "M-220 122 C -20 100, 220 152, 500 122 S 920 96, 1320 114 S 1700 136, 1850 108";

export default function UpgradePageAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#070b14]" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/20 via-transparent to-white/65 dark:from-[#0a1220]/72 dark:via-[#070b14] dark:to-[#060912]" />

      <CurrentRibbon
        id="gp-c1"
        path={CURRENT_1}
        className="gp-upgrade-current--1"
        strokeWidth={26}
      />
      <CurrentRibbon
        id="gp-c2"
        path={CURRENT_2}
        className="gp-upgrade-current--2"
        strokeWidth={34}
      />
      <CurrentRibbon
        id="gp-c3"
        path={CURRENT_3}
        className="gp-upgrade-current--3"
        strokeWidth={28}
      />
      <CurrentRibbon
        id="gp-c4"
        path={CURRENT_4}
        className="gp-upgrade-current--4"
        strokeWidth={22}
      />
      <CurrentRibbon
        id="gp-c5"
        path={CURRENT_5}
        className="gp-upgrade-current--5"
        strokeWidth={16}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_75%_at_50%_42%,transparent_0%,transparent_58%,rgb(15_23_42/0.05)_100%)] dark:bg-[radial-gradient(ellipse_92%_78%_at_50%_38%,transparent_0%,transparent_52%,rgb(0_0_0/0.4)_100%)]" />
    </div>
  );
}
