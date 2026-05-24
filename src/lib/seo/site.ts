import type { Metadata } from "next";
import { steamHeaderImage } from "@/lib/curated/game-links";
import { getSiteOrigin as resolveSiteOrigin } from "@/lib/site-url";

export const SITE_NAME = "GamePing AI";

/** Default homepage / root meta description (gaming-native positioning). */
export const DEFAULT_SITE_DESCRIPTION =
  "Describe what you feel like playing. GamePing finds games that actually match your vibe — with real store prices and price alerts.";

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

const DEFAULT_OG_IMAGE = steamHeaderImage(1145360);

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
      images: [{ url: ogImage, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [ogImage],
    },
  };
}

export function buildNoIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: ROBOTS_NOINDEX,
  };
}
