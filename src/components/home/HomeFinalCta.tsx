import Link from "next/link";
import PingOrb from "@/components/home/PingOrb";

export default function HomeFinalCta() {
  return (
    <section className="px-6 pb-24 pt-4 md:pb-32">
      <div className="gp-home-glass relative mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/[0.1] px-8 py-14 text-center md:px-12 md:py-16">
        <span className="gp-home-panel-blob" aria-hidden />
        <PingOrb size={92} className="relative mx-auto" />
        <h2 className="relative mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
          Stop searching by tags. Start discovering by taste.
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-base leading-7 text-white/55">
          Describe what you want to feel while playing. Ping handles the rest.
        </p>
        <Link
          href="/recommend"
          className="gp-home-cta-primary relative mt-8 inline-flex min-w-[220px] items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold text-[#041814] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Try GamePing
        </Link>
      </div>
    </section>
  );
}
