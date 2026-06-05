export type SiteSocialLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

/** Official GamePing AI social profiles. */
export const SITE_SOCIAL_LINKS: SiteSocialLink[] = [
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
