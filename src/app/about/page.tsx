import Navbar from "@/components/Navbar";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/12 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            About
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            What is <span className="text-cyan-300">GamePing AI</span>?
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
            GamePing AI is an AI-powered game recommendation assistant. You describe what you feel
            like playing, and GamePing responds with a small set of verified games—with metadata and
            best-effort deal-aware price lookups.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
                Discover
              </p>
              <h2 className="mt-3 text-xl font-black">Find games that fit your intent</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                The goal is coherence over noise. Recommendations are generated automatically and
                may not always be perfect.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
                Track
              </p>
              <h2 className="mt-3 text-xl font-black">Save searches for later</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Save your preferences and results so you can revisit them from your dashboard.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
                Alerts
              </p>
              <h2 className="mt-3 text-xl font-black">Future deal alerts</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                The roadmap includes periodic price checks and notifications when tracked games hit
                your budget.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <h2 className="text-2xl font-black">Data sources and disclaimers</h2>
            <p className="mt-3 text-white/60 leading-7">
              Game metadata and prices are sourced from third-party providers (as configured) such
              as RAWG and CheapShark. Prices and availability may change. Always verify final prices
              and purchase details on the store before buying.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">
            This page is provided for general informational purposes and does not constitute legal
            advice.
          </div>
        </div>
      </section>
    </main>
  );
}

