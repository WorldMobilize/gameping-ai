type IconProps = {
  className?: string;
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.85,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Genre tags flowing into a player heart */
export function BeyondGenresIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <rect x="2" y="4" width="7" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
      <rect x="2" y="9" width="9" height="3" rx="1.5" fill="currentColor" fillOpacity="0.12" />
      <rect x="2" y="14" width="6" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1" />
      <path d="M11 5.5h3M11 10.5h4M11 15.5h2" strokeWidth="1.4" opacity="0.45" />
      <path
        d="M17.5 10.5c1.2-1.5 3.5-1.2 3.8 1.1.2 1.5-.8 2.8-2.2 3.8-1.1.8-2.1 1.6-2.1 1.6s-1-.8-2.1-1.6c-1.4-1-2.4-2.3-2.2-3.8.3-2.3 2.6-2.6 3.8-1.1z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path d="M17.5 10.5c1.2-1.5 3.5-1.2 3.8 1.1.2 1.5-.8 2.8-2.2 3.8-1.1.8-2.1 1.6-2.1 1.6s-1-.8-2.1-1.6c-1.4-1-2.4-2.3-2.2-3.8.3-2.3 2.6-2.6 3.8-1.1z" />
    </svg>
  );
}

/** Game card + explanation bubble */
export function ExplainableIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <rect x="3" y="5" width="11" height="14" rx="2" fill="currentColor" fillOpacity="0.14" />
      <rect x="3" y="5" width="11" height="14" rx="2" />
      <path d="M6 9h5M6 12h4" strokeWidth="1.5" opacity="0.65" />
      <path
        d="M16 8a2.5 2.5 0 0 1 2.5 2.5v4.5a2.5 2.5 0 0 1-2.5 2.5h-2l-2.5 2v-2H13a2.5 2.5 0 0 1-2.5-2.5v-1"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M16 8a2.5 2.5 0 0 1 2.5 2.5v4.5a2.5 2.5 0 0 1-2.5 2.5h-2l-2.5 2v-2H13a2.5 2.5 0 0 1-2.5-2.5v-1" />
      <path d="M14.5 12h3M14.5 14.5h2" strokeWidth="1.4" />
    </svg>
  );
}

/** Gem / treasure discovery */
export function HiddenGemsIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <path
        d="M12 3 5 9l7 12 7-12-7-6z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <path d="M12 3 5 9l7 12 7-12-7-6z" />
      <path d="M5 9h14M9 9l3 12 3-12M12 3v6" strokeWidth="1.6" />
      <path
        d="m18 4 1.2 1.2M20 7.5l1.5.5"
        strokeWidth="1.4"
        opacity="0.55"
      />
    </svg>
  );
}

/** Controller + check — confident play decision */
export function BetterDecisionsIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <rect x="2" y="10" width="14" height="7" rx="3" fill="currentColor" fillOpacity="0.14" />
      <rect x="2" y="10" width="14" height="7" rx="3" />
      <path d="M5.5 13v2M4 14.5h3" strokeWidth="1.5" />
      <circle cx="12" cy="13.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14" cy="15" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="19" cy="7" r="4" fill="currentColor" fillOpacity="0.18" />
      <circle cx="19" cy="7" r="4" />
      <path d="m17.2 7 1.2 1.2 2.6-2.6" strokeWidth="1.6" />
    </svg>
  );
}

export function TasteDiscoveryIcon({ className = "h-6 w-6" }: IconProps) {
  return <BeyondGenresIcon className={className} />;
}

export function GamingDnaIcon({ className = "h-6 w-6" }: IconProps) {
  return <HiddenGemsIcon className={className} />;
}

export function RefineSearchIcon({ className = "h-6 w-6" }: IconProps) {
  return <ExplainableIcon className={className} />;
}

export function DealAwareIcon({ className = "h-6 w-6" }: IconProps) {
  return <BetterDecisionsIcon className={className} />;
}

export function HomeValuePropIcon({
  id,
  className = "h-9 w-9 shrink-0 text-slate-800 dark:text-slate-100",
}: {
  id: string;
  className?: string;
}) {
  switch (id) {
    case "beyond-genres":
      return <BeyondGenresIcon className={className} />;
    case "explainable":
      return <ExplainableIcon className={className} />;
    case "hidden-gems":
      return <HiddenGemsIcon className={className} />;
    case "better-decisions":
      return <BetterDecisionsIcon className={className} />;
    case "check-deals":
      return <DealAwareIcon className={className} />;
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
