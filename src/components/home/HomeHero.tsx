import Link from "next/link";
import HomeHeroShowcase from "@/components/home/HomeHeroShowcase";
import HomePageAtmosphere from "@/components/home/HomePageAtmosphere";

export default function HomeHero() {
  return (
    <section className="gp-landing-hero relative overflow-hidden">
      <HomePageAtmosphere variant="hero" />

      <div className="gp-landing-wrap relative z-10">
        <div className="gp-landing-hero-grid">
          <div className="min-w-0">
            <h1 className="gp-landing-h1">
              Find the next game you&apos;ll actually{" "}
              <span className="gp-landing-accent">love.</span>
            </h1>

            <p className="gp-landing-lead mt-6 max-w-xl">
              GamePing learns your taste, explains every recommendation, and helps you
              discover games worth your time.
            </p>

            <div className="mt-9 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center">
              <Link href="/recommend" className="gp-landing-btn-primary">
                Try GamePing
                <span aria-hidden>→</span>
              </Link>
              <a href="#how-it-works" className="gp-landing-btn-secondary">
                <svg className="h-4 w-4 shrink-0 opacity-80" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M10 8.5v7l6.5-3.5L10 8.5z" />
                </svg>
                See how it works
              </a>
            </div>

            <p className="gp-landing-trust mt-6">
              <span>No login required</span>
              <span aria-hidden>·</span>
              <span>Under a minute</span>
              <span aria-hidden>·</span>
              <span>Prices on every game page</span>
            </p>

            <nav aria-label="Explore GamePing" className="gp-landing-links">
              <Link href="/recommend">Personal recommendations</Link>
              <Link href="/games">Games A–Z</Link>
              <Link href="/curated">Curated lists</Link>
            </nav>
          </div>

          <div className="min-w-0 w-full">
            <HomeHeroShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
