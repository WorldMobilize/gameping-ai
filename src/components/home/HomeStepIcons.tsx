type IconProps = { className?: string };

const BASE = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function StepPingIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  );
}

export function StepTasteIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function StepLoveIcon({ className = "h-6 w-6" }: IconProps) {
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

export function TrustTargetIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function TrustShieldIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
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
  const className = "h-7 w-7";
  switch (id) {
    case "ping":
      return <StepPingIcon className={className} />;
    case "taste":
      return <StepTasteIcon className={className} />;
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
