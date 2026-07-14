export type SiteSocialLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

/** Official GamePing AI social + community profiles. */
export const SITE_SOCIAL_LINKS: SiteSocialLink[] = [
  {
    label: "Discord",
    href: "https://discord.gg/C4vqm9ARQY",
    ariaLabel: "Join the GamePing AI community on Discord",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/gamepingai",
    ariaLabel: "Follow GamePing AI on Instagram",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@gamepingai",
    ariaLabel: "Follow GamePing AI on TikTok",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@gamepingai",
    ariaLabel: "Follow GamePing AI on YouTube",
  },
  {
    label: "X",
    href: "https://x.com/gamepingai",
    ariaLabel: "Follow GamePing AI on X",
  },
];
