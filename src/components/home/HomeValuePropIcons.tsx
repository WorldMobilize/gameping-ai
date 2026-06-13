type IconProps = {
  className?: string;
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Clean compass — circle + bold north-east needle */
export function TasteDiscoveryIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path
        d="M15.5 8.5 13 13l-4.5 2.5L11 11l4.5-2.5z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <path d="M15.5 8.5 11 11l-2.5 4.5L13 13l2.5-4.5z" />
    </svg>
  );
}

/** Player taste profile — user in circle + signal node */
export function GamingDnaIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="2.4" fill="currentColor" fillOpacity="0.18" />
      <path d="M7.5 17.5a4.5 4.5 0 0 1 9 0" />
      <circle cx="17" cy="7" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Sliders — bold tuning controls */
export function RefineSearchIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <line x1="20" x2="14" y1="6" y2="6" />
      <line x1="10" x2="4" y1="6" y2="6" />
      <line x1="20" x2="13" y1="12" y2="12" />
      <line x1="9" x2="4" y1="12" y2="12" />
      <line x1="20" x2="16" y1="18" y2="18" />
      <line x1="12" x2="4" y1="18" y2="18" />
      <circle cx="12" cy="6" r="1.9" fill="currentColor" fillOpacity="0.18" />
      <circle cx="11" cy="12" r="1.9" fill="currentColor" fillOpacity="0.18" />
      <circle cx="14" cy="18" r="1.9" fill="currentColor" fillOpacity="0.18" />
    </svg>
  );
}

/** Tag — bold price tag */
export function DealAwareIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <path
        d="M12.6 3H5a2 2 0 0 0-2 2v7.6a2 2 0 0 0 .6 1.4l6.4 6.4a2 2 0 0 0 2.8 0l6-6a2 2 0 0 0 0-2.8L13.4 3.6A2 2 0 0 0 12.6 3z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HomeValuePropIcon({ id }: { id: string }) {
  const className = "gp-home-value-icon-svg h-7 w-7 shrink-0";

  switch (id) {
    case "taste":
      return <TasteDiscoveryIcon className={className} />;
    case "dna":
      return <GamingDnaIcon className={className} />;
    case "refine":
      return <RefineSearchIcon className={className} />;
    case "deals":
      return <DealAwareIcon className={className} />;
    default:
      return null;
  }
}
