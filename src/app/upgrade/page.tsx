import Navbar from "@/components/Navbar";

export default function UpgradePage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.5em] text-cyan-300">
            GamePing Premium
          </p>

          <h1 className="text-4xl font-black md:text-6xl">
            Upgrade to <span className="text-cyan-300">GamePing Premium</span>
          </h1>

          <p className="mt-4 max-w-2xl text-white/60">
            Save more searches, unlock smarter alerts, and get recommendations tuned to your intent.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-black">Free</h2>
              <p className="mt-2 text-sm text-white/50">Great to try GamePing.</p>

              <ul className="mt-6 space-y-3 text-white/70">
                <li>✔ 3 saved searches</li>
                <li>✔ Basic price alerts</li>
                <li>✔ Standard recommendations</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/10 p-8 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
              <h2 className="text-2xl font-black">
                Premium <span className="text-cyan-300">+</span>
              </h2>
              <p className="mt-2 text-sm text-white/55">
                For people who want alerts that actually feel useful.
              </p>

              <ul className="mt-6 space-y-3 text-white/80">
                <li>✔ 25 saved searches</li>
                <li>✔ Advanced price alerts</li>
                <li>✔ Priority recommendations</li>
                <li>✔ More tracking slots</li>
                <li>✔ Early access features</li>
              </ul>

              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled
                  className="rounded-full bg-cyan-400 px-8 py-4 font-black text-black transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upgrade with Stripe
                </button>

                <span className="text-sm text-white/55">Stripe checkout coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}