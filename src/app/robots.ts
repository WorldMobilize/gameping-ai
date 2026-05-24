import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/recommend", "/games", "/game/", "/curated", "/about", "/contact", "/legal"],
      disallow: [
        "/api/",
        "/dashboard",
        "/dashboard/",
        "/login",
        "/signup",
        "/auth/",
        "/billing/",
        "/settings/",
        "/upgrade",
        "/verify-success",
        "/reset-password",
        "/update-password",
      ],
    },
    sitemap: `${getSiteOrigin()}/sitemap.xml`,
  };
}
