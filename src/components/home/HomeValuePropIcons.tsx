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

/** Simple compass — circle + north-east needle */
export function TasteDiscoveryIcon({ className = "h-[22px] w-[22px]" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="12" x2="15.5" y2="8.5" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Player taste profile — user in circle + signal node */
export function GamingDnaIcon({ className = "h-[22px] w-[22px]" }: IconProps) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="2.25" />
      <path d="M7.5 18.5v-1a4.5 4.5 0 0 1 9 0v1" />
      <circle cx="16.75" cy="7.25" r="1.25" fill="currentColor" stroke="none" />
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
