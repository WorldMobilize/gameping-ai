type SocialPlatformIconProps = {
  platform: string;
  className?: string;
};

const DEFAULT_CLASS = "block h-[28px] w-[28px] shrink-0";

function BrandIcon({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className ?? DEFAULT_CLASS}
    >
      {children}
    </svg>
  );
}

/** Official-style brand marks (Simple Icons paths, inline SVG). */
export default function SocialPlatformIcon({
  platform,
  className,
}: SocialPlatformIconProps) {
  const cn = className ?? DEFAULT_CLASS;

  switch (platform) {
    case "Instagram":
      return (
        <BrandIcon className={cn}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </BrandIcon>
      );
    case "TikTok":
      return (
        <BrandIcon className={cn}>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.919-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v11.03c0 2.76-2.14 5-4.92 5-2.18 0-4.02-1.4-4.7-3.35-.21-.69-.32-1.43-.32-2.19 0-2.76 2.14-5 4.92-5 .64 0 1.27.12 1.85.35v4.07c-.6-.21-1.24-.33-1.89-.33-1.36 0-2.46 1.1-2.46 2.46 0 1.36 1.1 2.46 2.46 2.46 1.36 0 2.46-1.1 2.46-2.46V.02h3.47z" />
        </BrandIcon>
      );
    case "YouTube":
      return (
        <BrandIcon className={cn}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </BrandIcon>
      );
    case "X":
      return (
        <BrandIcon className={cn}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </BrandIcon>
      );
    default:
      /* Unknown label (e.g. future Discord) — add a case when the profile goes live. */
      return null;
  }
}
