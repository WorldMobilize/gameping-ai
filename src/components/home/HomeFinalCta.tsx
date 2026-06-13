import Link from "next/link";

export default function HomeFinalCta() {
  return (
    <section className="px-6 pb-24 pt-8 md:pb-32">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Ready to find your next favorite?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-white/50">
          Describe what you&apos;re in the mood for. GamePing handles the rest—and
          shows you why each pick fits.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/recommend"
            className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-cyan-400 px-8 py-3.5 text-sm font-semibold text-black transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Try GamePing
          </Link>
          <Link
            href="/curated"
            className="inline-flex min-w-[200px] items-center justify-center rounded-full border border-white/12 px-8 py-3.5 text-sm font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.04]"
          >
            Browse curated lists
          </Link>
        </div>
      </div>
    </section>
  );
}
