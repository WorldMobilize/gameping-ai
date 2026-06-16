"use client";

import Footer from "@/components/Footer";
import HomeLoggedInStrip from "@/components/HomeLoggedInStrip";
import HomeAdminSection from "@/components/home/HomeAdminSection";
import HomeComingSoon from "@/components/home/HomeComingSoon";
import HomeFeatureCards from "@/components/home/HomeFeatureCards";
import HomeHero from "@/components/home/HomeHero";
import HomeHowItWorks from "@/components/home/HomeHowItWorks";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import Navbar from "@/components/Navbar";

export default function HomePageShell() {
  const { theme, toggleTheme } = useHomeTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`relative flex min-h-screen flex-col overflow-x-hidden ${
        isDark ? "bg-[#0b0f1a] text-slate-100" : "bg-white text-slate-900"
      }`}
      data-home-theme={theme}
    >
      <div className="relative flex min-h-screen flex-col">
        <Navbar
          ctaLabel="Try GamePing"
          theme={theme}
          showHomeThemeToggle
          onHomeThemeToggle={toggleTheme}
        />
        <HomeLoggedInStrip theme={theme} />
        <main className="flex-1">
          <HomeHero />
          <HomeHowItWorks />
          <HomeFeatureCards />
          <HomeComingSoon />
          <HomeAdminSection />
        </main>
        <Footer theme={theme} />
      </div>
    </div>
  );
}
