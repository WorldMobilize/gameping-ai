import type { Metadata } from "next";
import HomePageShell from "@/components/home/HomePageShell";
import { buildPublicPageMetadata, DEFAULT_SITE_DESCRIPTION } from "@/lib/seo/site";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "GamePing AI — The AI companion for your gaming life",
  description: DEFAULT_SITE_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return <HomePageShell />;
}
