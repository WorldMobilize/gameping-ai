import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Public marketing, discovery, game, collection, feature, and legal pages
      // are crawlable. Everything not disallowed below is allowed by `/`.
      //
      // `/companion/about` is the indexable overview and needs an explicit Allow: the
      // list below blocks the `/companion` PREFIX (the download hub and the browser
      // tester are noindex tools, not search landing pages), and a prefix rule would
      // take the overview down with them. The more specific Allow wins.
      allow: ["/", "/companion/about"],
      disallow: [
        // APIs and internal endpoints
        "/api/",
        "/auth/",
        // Account-only / authenticated surfaces
        "/dashboard",
        "/settings/",
        // Auth flows
        "/login",
        "/reset-password",
        "/update-password",
        "/verify-success",
        // Premium personalized pages (user-specific data)
        "/weekly-picks",
        "/deals-for-you",
        "/monthly-recap",
        "/taste-dna",
        // Noindex tools, not landing pages: the Companion download hub and its
        // in-browser tester. /companion/about (the overview) is explicitly allowed above.
        "/companion",
        // Admin-only / not shipped: these 404 for everyone but an admin, so crawling
        // them is pure waste — and /creators promises money from a programme that
        // cannot pay anyone yet.
        "/parties",
        "/community-wars",
        "/creators",
      ],
    },
    sitemap: `${getSiteOrigin()}/sitemap.xml`,
  };
}
