import Link from "next/link";
import PingOrb from "@/components/home/PingOrb";

export default function HomeFinalCta() {
  return (
    <section className="gp-pastel-section px-5 pb-24 pt-4 md:pb-32">
      <div className="gp-pastel-shell gp-pastel-cta mx-auto max-w-3xl px-8 py-14 text-center md:px-12 md:py-16">
        <PingOrb size={80} variant="default" className="mx-auto" bars={4} />
        <h2 className="gp-pastel-section-title mt-6">
          Stop searching by tags. Start discovering by taste.
        </h2>
        <p className="gp-pastel-section-sub mx-auto mt-4 max-w-lg">
          Describe what you want to feel while playing. Ping handles the rest.
        </p>
        <Link href="/recommend" className="gp-pastel-btn-primary mt-8 inline-flex min-w-[220px]">
          Try GamePing
        </Link>
      </div>
    </section>
  );
}
