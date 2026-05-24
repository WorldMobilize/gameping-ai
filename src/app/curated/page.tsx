import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CURATED_COLLECTIONS } from "@/lib/curated/collections";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Curated game collections | GamePing AI",
  description:
    "Editor-style lists for popular searches—games like Hades, cozy picks, emotional stories, and more. Jump in, then get personalized recommendations.",
  path: "/curated",
});

export default function CuratedIndexPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16 md:py-20">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/12 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            SEO collections
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">
            Curated <span className="text-cyan-300">game lists</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
            Starting points for common searches—each page has context, examples, and links to dive
            deeper. When you are ready,{" "}
            <Link href="/recommend" className="font-bold text-cyan-300 underline-offset-4 hover:underline">
              run your own recommendation
            </Link>{" "}
            with GamePing AI.
          </p>

          <ul className="mt-12 space-y-4">
            {CURATED_COLLECTIONS.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/curated/${c.slug}`}
                  className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.06] md:flex-row md:items-center md:justify-between md:gap-6"
                >
                  <div>
                    <h2 className="text-xl font-black group-hover:text-cyan-200">{c.h1}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{c.intro}</p>
                  </div>
                  <span className="mt-4 shrink-0 text-sm font-black text-cyan-300 md:mt-0">
                    Read
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-6">
            <p className="text-sm font-bold text-cyan-100">
              Want picks tailored to you—not a static list?
            </p>
            <Link
              href="/recommend"
              className="mt-3 inline-flex rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-black shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300"
            >
              Try your own recommendation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
