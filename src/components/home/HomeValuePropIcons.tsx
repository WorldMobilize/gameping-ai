type IconProps = {
  className?: string;
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Exploration compass — cardinal ring + north needle */
export function TasteDiscoveryIcon({ className = "h-[22px] w-[22px]" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2" />
      <path
        d="M12 6.5 14.2 12.5 12 11 9.8 12.5 12 6.5z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M12 17.5 13.5 13 12 14 10.5 13 12 17.5z"
        stroke="currentColor"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  );
}

/** Player profile fingerprint — clean readable arcs */
export function GamingDnaIcon({ className = "h-[22px] w-[22px]" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <path d="M12 10.5a2.5 2.5 0 0 0-2.5 2.5" />
      <path d="M12 7.5a5.5 5.5 0 0 0-5.5 5.5" />
      <path d="M12 5a8 8 0 0 0-8 8" />
      <path d="M12 14v2.5" />
      <path d="M9 18.5a3 3 0 0 0 6 0" />
    </svg>
  );
}

/** Lucide-style SlidersHorizontal */
export function RefineSearchIcon({ className = "h-[22px] w-[22px]" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <line x1="21" x2="14" y1="4" y2="4" />
      <line x1="10" x2="3" y1="4" y2="4" />
      <line x1="21" x2="12" y1="12" y2="12" />
      <line x1="8" x2="3" y1="12" y2="12" />
      <line x1="21" x2="16" y1="20" y2="20" />
      <line x1="12" x2="3" y1="20" y2="20" />
      <line x1="14" x2="14" y1="2" y2="6" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="16" x2="16" y1="18" y2="22" />
    </svg>
  );
}

/** Lucide-style Tag */
export function DealAwareIcon({ className = "h-[22px] w-[22px]" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HomeValuePropIcon({ id }: { id: string }) {
  const className = "gp-home-value-icon-svg h-[22px] w-[22px] shrink-0 text-sky-400";

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
