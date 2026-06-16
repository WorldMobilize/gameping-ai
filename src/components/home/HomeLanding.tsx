import Image from "next/image";
import Link from "next/link";

export default function HomeLanding() {
  return (
    <section className="gp-scene-hero gp-hero-cyber relative overflow-hidden">
      <div className="gp-hero-cyber-bg" aria-hidden>
        <Image
          src="/images/hero-cyber-city.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="gp-hero-cyber-overlay" />
      </div>

      <div className="gp-scene-stage mx-auto w-full max-w-[1280px] px-5 pb-14 pt-28 md:px-8 md:pb-20 md:pt-32">
        <div className="gp-scene-copy">
          <p className="gp-landing-kicker">Personal game discovery</p>

          <h1 className="gp-landing-h1 mt-5 max-w-[16ch] leading-[1.06]">
            Find games you&apos;ll actually{" "}
            <span className="gp-landing-accent">love.</span>
          </h1>

          <p className="gp-landing-lead mt-8 max-w-lg text-[1.125rem] leading-[1.7]">
            GamePing uses AI to understand your taste, explain every recommendation, and help
            you discover games worth your time.
          </p>

          <div className="mt-10 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:items-center">
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

          <p className="gp-landing-trust mt-7">
            <span>No login required</span>
            <span aria-hidden>·</span>
            <span>Under a minute</span>
            <span aria-hidden>·</span>
            <span>No credit card</span>
          </p>

          <nav aria-label="Explore GamePing" className="gp-scene-links mt-12">
            <Link href="/recommend">Personal recommendations</Link>
            <Link href="/games">Games A–Z</Link>
            <Link href="/curated">Curated lists</Link>
          </nav>
        </div>
      </div>

      <div className="gp-hero-cyber-fade" aria-hidden />
    </section>
  );
}
