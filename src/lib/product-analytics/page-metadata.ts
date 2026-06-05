import type { ProductAnalyticsMetadata } from "./types";

export type ClientPageContext = {
  pathname: string;
  href: string;
  search: string;
  referrer: string;
};

/** Metadata for page_view — path in metadata for funnel SQL (metadata->>'path'). */
export function buildPageViewMetadataFromContext(
  ctx: ClientPageContext
): ProductAnalyticsMetadata {
  const meta: ProductAnalyticsMetadata = {
    path: ctx.pathname,
    full_url: ctx.href,
    referrer: ctx.referrer.trim() || null,
  };
  if (ctx.search) {
    meta.search = ctx.search;
  }
  return meta;
}

/** Metadata for session_start — landing page + referrer at session begin. */
export function buildSessionStartMetadataFromContext(
  ctx: ClientPageContext
): ProductAnalyticsMetadata {
  return {
    landing_path: ctx.pathname,
    landing_url: ctx.href,
    referrer: ctx.referrer.trim() || null,
  };
}

export function readClientPageContext(): ClientPageContext | null {
  if (typeof window === "undefined") return null;
  return {
    pathname: window.location.pathname,
    href: window.location.href,
    search: window.location.search,
    referrer: typeof document !== "undefined" ? document.referrer : "",
  };
}

export function buildPageViewMetadata(): ProductAnalyticsMetadata {
  const ctx = readClientPageContext();
  return ctx ? buildPageViewMetadataFromContext(ctx) : {};
}

export function buildSessionStartMetadata(): ProductAnalyticsMetadata {
  const ctx = readClientPageContext();
  return ctx ? buildSessionStartMetadataFromContext(ctx) : {};
}
