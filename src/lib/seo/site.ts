import type { Metadata } from "next";
import { getSiteOrigin as resolveSiteOrigin } from "@/lib/site-url";

export const SITE_NAME = "GamePing AI";

export const DEFAULT_SITE_TITLE = "GamePing AI — AI game discovery with real prices";

/** Default homepage / root meta description (gaming-native positioning). */
export const DEFAULT_SITE_DESCRIPTION =
  "Describe what you feel like playing. GamePing finds games that actually match your vibe — with real store prices and price alerts.";

/** Social card copy (Open Graph / Twitter) — stable branded preview text. */
export const DEFAULT_SOCIAL_DESCRIPTION =
  "Describe what you feel like playing. GamePing finds games that match your vibe — with real store prices and price alerts.";

/** Next.js file route: `src/app/opengraph-image.tsx` (1200×630). */
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

/** Canonical origin for sitemap, robots, and metadata (see `NEXT_PUBLIC_SITE_URL`). */
export function getSiteOrigin(): string {
  return resolveSiteOrigin();
}

export function getMetadataBase(): URL {
  return new URL(`${getSiteOrigin()}/`);
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, getMetadataBase()).toString();
}

export const ROBOTS_INDEX = { index: true, follow: true } as const;
export const ROBOTS_NOINDEX = { index: false, follow: false } as const;

export const DEFAULT_OG_IMAGE = absoluteUrl(DEFAULT_OG_IMAGE_PATH);

const DEFAULT_OG_IMAGE_META = {
  url: DEFAULT_OG_IMAGE,
  width: 1200,
  height: 630,
  alt: SITE_NAME,
} as const;

export type PublicPageSeoInput = {
  title: string;
  description: string;
  /** Path only, e.g. `/recommend` — query params are never included. */
  path: string;
  ogImage?: string | null;
};

/** Shared metadata for indexable marketing/content pages. */
export function buildPublicPageMetadata(input: PublicPageSeoInput): Metadata {
  const canonical = absoluteUrl(input.path);
  const ogImage = input.ogImage ?? DEFAULT_OG_IMAGE;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: ROBOTS_INDEX,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: input.title,
      description: input.description,
      url: canonical,
      images: [
        ogImage === DEFAULT_OG_IMAGE
          ? DEFAULT_OG_IMAGE_META
          : { url: ogImage, alt: SITE_NAME },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [
        ogImage === DEFAULT_OG_IMAGE
          ? DEFAULT_OG_IMAGE_META
          : { url: ogImage, alt: SITE_NAME },
      ],
    },
  };
}

export function buildNoIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: ROBOTS_NOINDEX,
  };
}
