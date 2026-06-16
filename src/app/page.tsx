import type { Metadata } from "next";
import HomePageShell from "@/components/home/HomePageShell";
import { HomeThemeProvider } from "@/components/home/HomeThemeProvider";
import { buildPublicPageMetadata, DEFAULT_SITE_DESCRIPTION } from "@/lib/seo/site";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "GamePing AI — Discover games worth your time",
  description: DEFAULT_SITE_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <HomeThemeProvider>
      <HomePageShell />
    </HomeThemeProvider>
  );
}
