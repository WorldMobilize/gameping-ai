import type { Metadata } from "next";
import HomePageShell from "@/components/home/HomePageShell";
import {
  buildPublicPageMetadata,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
} from "@/lib/seo/site";

export const metadata: Metadata = buildPublicPageMetadata({
  title: DEFAULT_SITE_TITLE,
  description: DEFAULT_SITE_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return <HomePageShell />;
}
