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
      <circle cx="12" cy="12" r="8" />
      <path d="M8 12h8M12 8v8" opacity="0.35" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

export function StepTasteIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
      <path d="M11 8v6M8 11h6" opacity="0.35" />
    </svg>
  );
}

export function StepLoveIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <path
        d="M12 20.5s-6.5-4.2-8.5-8.2C1.8 9.2 3.6 6 6.8 6c1.7 0 3.1.9 3.9 2.2.8-1.3 2.2-2.2 3.9-2.2 3.2 0 5 3.2 3.3 6.3-2 4-8.9 8.2-8.9 8.2z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path d="M12 20.5s-6.5-4.2-8.5-8.2C1.8 9.2 3.6 6 6.8 6c1.7 0 3.1.9 3.9 2.2.8-1.3 2.2-2.2 3.9-2.2 3.2 0 5 3.2 3.3 6.3-2 4-8.9 8.2-8.9 8.2z" />
    </svg>
  );
}

export function StepPromptIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} {...BASE}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
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
    case "prompt":
      return <StepPromptIcon className={className} />;
    default:
      return <StepPingIcon className={className} />;
  }
}
