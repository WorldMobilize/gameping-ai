import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo/site";

export function legalPageMetadata(
  path: string,
  title: string,
  description: string
): Metadata {
  return buildPublicPageMetadata({
    title: `${title} | GamePing AI`,
    description,
    path,
  });
}
