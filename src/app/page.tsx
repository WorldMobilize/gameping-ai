import type { Metadata } from "next";
import HomeGameCarousel from "@/components/HomeGameCarousel";
import HomeLoggedInStrip from "@/components/HomeLoggedInStrip";
import HomeFinalCta from "@/components/home/HomeFinalCta";
import HomeGamingDnaTeaser from "@/components/home/HomeGamingDnaTeaser";
import HomeHero from "@/components/home/HomeHero";
import HomeHowItWorks from "@/components/home/HomeHowItWorks";
import HomeValueGrid from "@/components/home/HomeValueGrid";
import Navbar from "@/components/Navbar";
import { buildPublicPageMetadata, DEFAULT_SITE_DESCRIPTION } from "@/lib/seo/site";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "GamePing AI — AI game discovery with real prices",
  description: DEFAULT_SITE_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <main className="gp-home min-h-screen overflow-x-hidden bg-[#05060f] text-white">
      <Navbar />
      <HomeLoggedInStrip />
      <HomeHero />
      <HomeGameCarousel />
      <HomeHowItWorks />
      <HomeValueGrid />
      <HomeGamingDnaTeaser />
      <HomeFinalCta />
    </main>
  );
}
