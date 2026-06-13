type IconProps = {
  className?: string;
};

const STROKE = 1.75;

/** Taste-based discovery — compass needle */
export function TasteDiscoveryIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth={STROKE} />
      <path
        d="M12 12 14.75 6.25"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12 9.25 17.75"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
      <path d="M12 4v1.5M12 18.5V20M4 12h1.5M18.5 12H20" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
    </svg>
  );
}

/** Gaming DNA — double helix strand */
export function GamingDnaIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 4c2.2 2.8 2.2 5.6 0 8.4s-2.2 5.6 0 8.4"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M16 4c-2.2 2.8-2.2 5.6 0 8.4s2.2 5.6 0 8.4"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path d="M9.5 7h5M9.5 12h5M9.5 17h5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

/** Refine search — tuning sliders */
export function RefineSearchIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="15" cy="7" r="2.25" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="9" cy="12" r="2.25" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="13" cy="17" r="2.25" stroke="currentColor" strokeWidth={STROKE} />
    </svg>
  );
}

/** Deal aware — price tag */
export function DealAwareIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 5h7l4 3.5v9.5L14 21l-7-3V5z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M14 5v3.5H18"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10.5" cy="9.5" r="1.25" stroke="currentColor" strokeWidth={STROKE} />
      <path
        d="M9 14.5 10.5 16 13.5 12.5"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomeValuePropIcon({ id }: { id: string }) {
  const className = "h-[18px] w-[18px] shrink-0 text-sky-400";

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
