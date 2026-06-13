import Link from "next/link";
import HomeHeroAtmosphere from "@/components/home/HomeHeroAtmosphere";
import HomeHeroProductPreview from "@/components/home/HomeHeroProductPreview";
import HomeValueCards from "@/components/home/HomeValueCards";

export default function HomeHero() {
  return (
    <section className="gp-pastel-hero relative overflow-hidden px-5 pb-12 pt-28 min-[960px]:px-8 min-[960px]:pb-16 min-[960px]:pt-32 xl:px-10 2xl:px-16">
      <HomeHeroAtmosphere />

      <div className="relative z-10 mx-auto w-full max-w-[1500px]">
        <div className="grid grid-cols-1 items-center gap-12 min-[960px]:grid-cols-[minmax(340px,0.92fr)_minmax(420px,1.08fr)] min-[960px]:gap-10 xl:gap-14">
          <div className="gp-home-hero-copy min-w-0">
            <p className="gp-pastel-eyebrow">
              <span className="gp-pastel-eyebrow-dot" aria-hidden />
              Meet Ping · your discovery companion
            </p>

            <h1 className="gp-pastel-headline mt-7">
              Find the next game you&apos;ll actually{" "}
              <span className="gp-pastel-accent">love.</span>
            </h1>

            <p className="gp-pastel-subcopy mt-6 max-w-xl">
              Ping learns your taste, explains every recommendation, and helps you
              discover games worth your time.
            </p>

            <div className="mt-10 flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-stretch">
              <Link href="/recommend" className="gp-pastel-btn-primary">
                Try GamePing
              </Link>
              <a href="#how-it-works" className="gp-pastel-btn-secondary">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M10 8.5v7l6.5-3.5L10 8.5z" />
                </svg>
                See how it works
              </a>
            </div>

            <p className="gp-pastel-trust mt-6">
              <span>No login required</span>
              <span aria-hidden>·</span>
              <span>Under a minute</span>
              <span aria-hidden>·</span>
              <span>Prices on every game page</span>
            </p>

            <nav aria-label="Explore GamePing" className="gp-pastel-nav mt-10">
              <Link href="/recommend">Personal recommendations</Link>
              <Link href="/games">Games A–Z</Link>
              <Link href="/curated">Curated lists</Link>
            </nav>
          </div>

          <div className="gp-home-hero-showcase min-w-0 w-full">
            <HomeHeroProductPreview />
          </div>
        </div>

        <HomeValueCards />
      </div>
    </section>
  );
}
