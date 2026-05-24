import type { MetadataRoute } from "next";
import { getAllSitemapPaths } from "@/lib/seo/sitemap-paths";
import { getSiteOrigin } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const now = new Date();

  return getAllSitemapPaths().map((path) => ({
    url: `${origin}${path}`,
    lastModified: now,
    changeFrequency: path.startsWith("/game/") ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/game/") ? 0.8 : 0.7,
  }));
}
