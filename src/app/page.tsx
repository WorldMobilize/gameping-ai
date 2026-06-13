import type { Metadata } from "next";
import HomeGameCarousel from "@/components/HomeGameCarousel";
import HomeLoggedInStrip from "@/components/HomeLoggedInStrip";
import HomeDealsSection from "@/components/home/HomeDealsSection";
import HomeFinalCta from "@/components/home/HomeFinalCta";
import HomeGamingDnaTeaser from "@/components/home/HomeGamingDnaTeaser";
import HomeHero from "@/components/home/HomeHero";
import HomeHowItWorks from "@/components/home/HomeHowItWorks";
import HomePersonalFit from "@/components/home/HomePersonalFit";
import HomeTasteNotTags from "@/components/home/HomeTasteNotTags";
import Navbar from "@/components/Navbar";
import { buildPublicPageMetadata, DEFAULT_SITE_DESCRIPTION } from "@/lib/seo/site";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "GamePing AI — Discover games worth your time",
  description: DEFAULT_SITE_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <main className="gp-home gp-pastel-app min-h-screen overflow-x-hidden text-white">
      <Navbar />
      <HomeLoggedInStrip />
      <HomeHero />
      <HomeTasteNotTags />
      <HomeHowItWorks />
      <HomeGameCarousel />
      <HomeGamingDnaTeaser />
      <HomePersonalFit />
      <HomeDealsSection />
      <HomeFinalCta />
    </main>
  );
}
