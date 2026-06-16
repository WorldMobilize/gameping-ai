type IconProps = { className?: string };

const BASE = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.85,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Chat bubble + small gamepad — tell GamePing your mood */
export function StepPingIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <path
        d="M19 14a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M19 14a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8z" />
      <path d="M9 9h.01M12 9h.01M15 9h.01" strokeWidth="2.5" />
      <rect x="14.5" y="3.5" width="7" height="4.5" rx="1.5" fill="currentColor" fillOpacity="0.18" />
      <path d="M15.5 5.5v1.5M17 6.25h1.5" strokeWidth="1.5" />
      <circle cx="19" cy="6.25" r="0.55" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Brain + discovery spark — understanding player taste */
export function StepTasteIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <path
        d="M8 5.5c-2 1.2-3 3.2-2.8 5.4-.2 1.6.4 3 1.8 4.1C8.8 16.2 10.2 17 12 17c1.8 0 3.2-.8 4-2 1.4-1.1 2-2.5 1.8-4.1.2-2.2-.8-4.2-2.8-5.4-.8-.5-1.7-.8-2.7-.8s-1.9.3-2.5.8z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M8 5.5c-2 1.2-3 3.2-2.8 5.4-.2 1.6.4 3 1.8 4.1C8.8 16.2 10.2 17 12 17c1.8 0 3.2-.8 4-2 1.4-1.1 2-2.5 1.8-4.1.2-2.2-.8-4.2-2.8-5.4-.8-.5-1.7-.8-2.7-.8s-1.9.3-2.5.8z" />
      <path d="M10 8.5c.5 1 .5 2 0 3M14 8.5c-.5 1-.5 2 0 3" strokeWidth="1.5" />
      <path
        d="m18.5 4 1 2 2 1-1.5 1.4.3 2.2-1.8-1-1.8 1 .3-2.2L15 7l2-1 1.5-2z"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="none"
      />
    </svg>
  );
}

/** Stack of game cards + match badge */
export function StepMatchesIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <rect x="3" y="8" width="10" height="12" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="3" y="8" width="10" height="12" rx="2" />
      <rect x="7" y="5" width="10" height="12" rx="2" fill="currentColor" fillOpacity="0.16" />
      <rect x="7" y="5" width="10" height="12" rx="2" />
      <rect x="11" y="2" width="10" height="12" rx="2" fill="currentColor" fillOpacity="0.22" />
      <rect x="11" y="2" width="10" height="12" rx="2" />
      <path d="M14 6h4M14 9h3" strokeWidth="1.5" opacity="0.7" />
      <circle cx="19" cy="17" r="3.5" fill="currentColor" fillOpacity="0.2" />
      <circle cx="19" cy="17" r="3.5" />
      <path d="m17.5 17 1 1 2.5-2.5" strokeWidth="1.6" />
    </svg>
  );
}

/** Controller with play — start playing */
export function StepPlayIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <rect x="3" y="9" width="18" height="9" rx="4" fill="currentColor" fillOpacity="0.14" />
      <rect x="3" y="9" width="18" height="9" rx="4" />
      <path d="M8 12.5v3M6.5 14h3" strokeWidth="1.6" />
      <circle cx="16" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
      <path d="M12 4.5v3l2.5-1.5L12 4.5z" fill="currentColor" fillOpacity="0.35" />
      <path d="M12 4.5v3l2.5-1.5L12 4.5z" strokeWidth="1.5" />
    </svg>
  );
}

export function StepLoveIcon({ className = "h-6 w-6" }: IconProps) {
  return <StepPlayIcon className={className} />;
}

export function TrustTargetIcon({ className = "h-5 w-5" }: IconProps) {
  return <StepMatchesIcon className={className} />;
}

export function TrustShieldIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <path d="M12 3 4 7v5c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4z" fill="currentColor" fillOpacity="0.12" />
      <path d="M12 3 4 7v5c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function TrustBoltIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" fillOpacity="0.12" />
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

export function TrustHeartIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <path
        d="M12 20.5s-6.5-4.2-8.5-8.2C1.8 9.2 3.6 6 6.8 6c1.7 0 3.1.9 3.9 2.2.8-1.3 2.2-2.2 3.9-2.2 3.2 0 5 3.2 3.3 6.3-2 4-8.9 8.2-8.9 8.2z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M12 20.5s-6.5-4.2-8.5-8.2C1.8 9.2 3.6 6 6.8 6c1.7 0 3.1.9 3.9 2.2.8-1.3 2.2-2.2 3.9-2.2 3.2 0 5 3.2 3.3 6.3-2 4-8.9 8.2-8.9 8.2z" />
    </svg>
  );
}

export function HomeStepIcon({ id }: { id: string }) {
  const className = "h-9 w-9";
  switch (id) {
    case "ping":
      return <StepPingIcon className={className} />;
    case "taste":
      return <StepTasteIcon className={className} />;
    case "matches":
      return <StepMatchesIcon className={className} />;
    case "play":
      return <StepPlayIcon className={className} />;
    case "love":
      return <StepLoveIcon className={className} />;
    default:
      return <StepPingIcon className={className} />;
  }
}

export function HomeTrustPillarIcon({ id }: { id: string }) {
  switch (id) {
    case "target":
      return <TrustTargetIcon />;
    case "shield":
      return <TrustShieldIcon />;
    case "bolt":
      return <TrustBoltIcon />;
    case "heart":
      return <TrustHeartIcon />;
    default:
      return <TrustTargetIcon />;
  }
}
