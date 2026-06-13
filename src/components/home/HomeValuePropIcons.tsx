type IconProps = {
  className?: string;
};

const STROKE = 1.65;

/** Finding new worlds — compass with discovery marker */
export function TasteDiscoveryIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={STROKE} opacity="0.35" />
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth={STROKE} />
      <path
        d="M12 8.5 13.6 12 12 15.5 10.4 12Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path d="M12 4.5v1.2M12 18.3v1.2M4.5 12h1.2M18.3 12h1.2" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="16.8" cy="7.2" r="1.1" fill="currentColor" opacity="0.85" />
      <path d="M16.8 7.2 14.2 10.2" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** Personal gaming profile — fingerprint + identity nodes */
export function GamingDnaIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4.5c-2.8 0-4.5 2-4.5 4.2 0 1.8.8 2.8 1.8 3.8M12 4.5c2.8 0 4.5 2 4.5 4.2 0 1.8-.8 2.8-1.8 3.8M12 12.5v3.5M9.2 16.2c.6 1.4 1.8 2.3 2.8 2.3s2.2-.9 2.8-2.3"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <circle cx="7" cy="18.5" r="1.35" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="12" cy="20" r="1.35" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="17" cy="18.5" r="1.35" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M8.35 18.5 10.65 19.6M13.35 19.6 15.65 18.5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

/** Shape recommendations — sliders + branching path */
export function RefineSearchIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8h11M4 13h9M4 18h7" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="17" cy="8" r="2" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="15" cy="13" r="2" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="13" cy="18" r="2" stroke="currentColor" strokeWidth={STROKE} />
      <path
        d="M19 5v4M19 5h3M19 5h-3M21 16v3M21 16h2M21 16h-2"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </svg>
  );
}

/** Never miss the right moment — tag + radar pulse */
export function DealAwareIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 6.5h6.5l3 2.8v8.2L12 20l-5.5-2.5V6.5z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path d="M13 6.5v2.8H16.5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M9.5 11.5 10.8 12.8 13.2 10.2"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18.5 9a3.5 3.5 0 0 1 0 6" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity="0.45" />
      <path d="M20 9a5 5 0 0 1 0 6" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity="0.25" />
      <circle cx="18.5" cy="12" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function HomeValuePropIcon({ id }: { id: string }) {
  const className = "gp-home-value-icon-svg h-[18px] w-[18px] shrink-0 text-sky-400";

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
