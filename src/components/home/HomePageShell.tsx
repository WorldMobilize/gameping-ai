"use client";

import Footer from "@/components/Footer";
import HomeLoggedInStrip from "@/components/HomeLoggedInStrip";
import HomeEcosystemLanding from "@/components/home/HomeEcosystemLanding";
import { useHomeTheme } from "@/components/home/HomeThemeProvider";
import Navbar from "@/components/Navbar";

/**
 * Landing shell. The old fixed cinematic image is gone — the page now sits on
 * the clean holographic base (theme-aware `.gp-landing-bg`, no imagery) and the
 * body is the new ecosystem landing (Discovery / World Mobilize / Companion).
 * The previous recommend-only sections (HomeHero/HowItWorks/FeatureCards/…)
 * stay on disk, unused, so we can iterate the demo without losing them.
 */
export default function HomePageShell() {
  const { theme } = useHomeTheme();
  const isDark = theme !== "light";

  return (
    <div
      className={`gp-landing gp-accent-page relative flex min-h-screen flex-col overflow-x-clip ${
        isDark ? "text-slate-100" : "text-slate-900"
      }`}
      style={{ backgroundColor: "var(--gp-bg-base)" }}
    >
      {/* Fixed clean base + subtle accent glows (no image). */}
      <div aria-hidden className="gp-landing-bg" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <HomeLoggedInStrip theme={theme} />
        <HomeEcosystemLanding />
        <Footer theme={theme} />
      </div>
    </div>
  );
}
