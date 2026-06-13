import Link from "next/link";

export default function HomeFinalCta() {
  return (
    <section className="px-6 pb-24 pt-4 md:pb-32">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/[0.08] bg-[#0a0d14]/80 px-8 py-14 text-center md:px-12 md:py-16">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Stop searching by tags. Start discovering by taste.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-white/50">
          Describe what you want to feel while playing. GamePing handles the rest.
        </p>
        <Link
          href="/recommend"
          className="mt-8 inline-flex min-w-[220px] items-center justify-center rounded-xl bg-sky-400 px-8 py-3.5 text-sm font-semibold text-[#041018] transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          Try GamePing
        </Link>
      </div>
    </section>
  );
}
