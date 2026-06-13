import Link from "next/link";
import HomePageAtmosphere from "@/components/home/HomePageAtmosphere";
import PingOrb from "@/components/home/PingOrb";

export default function HomeFinalCta() {
  return (
    <section className="gp-landing-section pb-24 md:pb-32">
      <HomePageAtmosphere variant="section" />

      <div className="gp-landing-wrap relative z-10">
        <div className="gp-landing-shell gp-landing-cta-shell">
          <PingOrb size={72} variant="default" className="mx-auto" bars={4} />
          <h2 className="gp-landing-h2 mt-6">
            Stop searching by tags. Start discovering by{" "}
            <span className="gp-landing-accent">taste.</span>
          </h2>
          <p className="gp-landing-body mx-auto mt-4 max-w-lg">
            Describe what you want to feel while playing. Ping handles the rest.
          </p>
          <Link href="/recommend" className="gp-landing-btn-primary mt-8 inline-flex min-w-[220px]">
            Try GamePing
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
