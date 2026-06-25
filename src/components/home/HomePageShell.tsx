"use client";

import Footer from "@/components/Footer";
import HomeLoggedInStrip from "@/components/HomeLoggedInStrip";
import HomeAdminSection from "@/components/home/HomeAdminSection";
import HomeClosing from "@/components/home/HomeClosing";
import HomeComingSoon from "@/components/home/HomeComingSoon";
import HomeFeatureCards from "@/components/home/HomeFeatureCards";
import HomeHero from "@/components/home/HomeHero";
import HomeHowItWorks from "@/components/home/HomeHowItWorks";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import Navbar from "@/components/Navbar";

export default function HomePageShell() {
  // The landing background is a fixed brand asset — one dark cinematic image,
  // pixel-identical in both themes (no overlays, washes, glows, or recolouring).
  // The "room" is always dark, so the base colour + on-background text base are
  // theme-independent. Only the UI SURFACES react to theme: dark glass in dark
  // mode, light frosted "holographic" glass in light mode (handled per surface
  // via useHomeTheme). The footer stays dark so it blends into the room (no
  // white block) rather than flipping to a solid light panel.
  const { theme } = useHomeTheme();

  return (
    <div className="gp-landing relative flex min-h-screen flex-col overflow-x-clip bg-[#070b14] text-slate-100">
      {/* Fixed cinematic background image — the SAME image and treatment in both
       * themes. It stays put while the page scrolls so the whole landing shares
       * one continuous atmosphere. Reference art lives in the PNG. */}
      <div aria-hidden className="gp-landing-bg" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar ctaLabel="Try GamePing" />
        <HomeLoggedInStrip theme={theme} />
        <main className="flex-1">
          <HomeHero />
          <HomeHowItWorks />
          <HomeFeatureCards />
          <HomeComingSoon />
          <HomeAdminSection />
          <HomeClosing />
        </main>
        {/* Soft bridge into the footer so the page resolves instead of cutting */}
        <div
          aria-hidden
          className="h-16 w-full bg-gradient-to-b from-transparent to-[#070b14] sm:h-20"
        />
        <Footer theme="dark" />
      </div>
    </div>
  );
}
