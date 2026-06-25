import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Public marketing, discovery, game, collection, feature, and legal pages
      // are crawlable. Everything not disallowed below is allowed by `/`.
      allow: "/",
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
        // Admin / future / experimental
        "/parties",
        "/companion",
      ],
    },
    sitemap: `${getSiteOrigin()}/sitemap.xml`,
  };
}
