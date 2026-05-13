import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            Support
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Contact</h1>

          <p className="mt-6 text-white/65 leading-7">
            Need help, want to report a bug, or have a question about your saved searches, pricing,
            or account data? Email our support inbox and include any relevant details (device,
            browser, and steps to reproduce).
          </p>

          <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200">
              Support email
            </p>
            <p className="mt-3 break-all text-lg font-black text-cyan-300">
              support@gamepingai.com
            </p>
            <p className="mt-3 text-sm text-white/55">
              We aim to respond within a reasonable timeframe. During early access, response times
              may vary.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">
            This page is provided for general informational purposes and does not constitute legal
            advice.
          </div>

          <div className="mt-14 rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 to-purple-500/10 p-8 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                Next step
              </p>
              <p className="mt-2 text-xl font-black md:text-2xl">
                Ready to discover your next game?
              </p>
            </div>
            <Link
              href="/recommend"
              className="mt-6 inline-flex rounded-full bg-cyan-400 px-8 py-3.5 text-sm font-black text-black shadow-[0_0_28px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300 md:mt-0"
            >
              Open GamePing AI →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}