import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/12 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-xl text-center md:text-left">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            404
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Page not found</h1>
          <p className="mt-5 text-base leading-7 text-white/55">
            That URL doesn&apos;t match anything on GamePing AI. You might have followed an old
            link—here are a few useful places to go instead.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-8 py-3.5 text-sm font-black text-black shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300"
            >
              Back home
            </Link>
            <Link
              href="/recommend"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-8 py-3.5 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              Try AI recommendations
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-8 py-3.5 text-sm font-bold text-white/85 transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              Browse games
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
