type SocialPlatformIconProps = {
  platform: string;
  className?: string;
};

const iconProps = {
  width: 24,
  height: 24,
  fill: "currentColor",
  "aria-hidden": true as const,
};

/** Minimal platform icons for footer social links (no external icon library). */
export default function SocialPlatformIcon({
  platform,
  className,
}: SocialPlatformIconProps) {
  switch (platform) {
    case "Instagram":
      return (
        <svg viewBox="0 0 24 24" className={className} {...iconProps}>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM18 6.3a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2z" />
        </svg>
      );
    case "TikTok":
      return (
        <svg viewBox="0 0 24 24" className={className} {...iconProps}>
          <path d="M16.5 3h2.2c.2 1.6 1.1 3.1 2.6 3.9V9c-1.2-.04-2.3-.47-3.2-1.2v7.8c0 3.4-2.8 5.5-5.8 5.5-2.9 0-5.3-2.2-5.3-5.1 0-3 2.4-5.1 5.5-5.1.4 0 .9.04 1.3.1v2.4c-.4-.1-.8-.16-1.2-.16-1.7 0-3 1.2-3 2.9s1.3 2.9 3 2.9c1.9 0 3-1.2 3-3.3V3z" />
        </svg>
      );
    case "YouTube":
      return (
        <svg viewBox="0 0 24 24" className={className} {...iconProps}>
          <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.6 12 4.6 12 4.6s-5.9 0-7.6.6a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.6 7.6.6 7.6.6s5.9 0 7.6-.6a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .4-4.8 29 29 0 0 0-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
        </svg>
      );
    case "X":
      return (
        <svg viewBox="0 0 24 24" className={className} {...iconProps}>
          <path d="M17.3 3h3.2l-7 8.1L21.5 21h-6.1l-4.8-6.3L5 21H1.8l7.5-8.6L2.5 3h6.2l4.3 5.7L17.3 3zm-1.1 16.2h1.8L7.9 4.8H6l10.2 14.4z" />
        </svg>
      );
    default:
      return null;
  }
}
