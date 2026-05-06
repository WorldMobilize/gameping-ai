import Navbar from "@/components/Navbar";

export default function UpgradePage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-black">
          Upgrade to <span className="text-cyan-300">Premium</span>
        </h1>

        <p className="mt-4 text-white/60">
          Unlock more searches and smarter alerts.
        </p>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-black">Premium</h2>

          <ul className="mt-6 space-y-3 text-white/70">
            <li>✔ Up to 3 saved searches</li>
            <li>✔ Smart alerts for each search</li>
            <li>✔ Better recommendations (AI)</li>
          </ul>

          <button className="mt-8 rounded-full bg-cyan-400 px-8 py-4 font-bold text-black hover:bg-cyan-300 transition">
            Upgrade (coming soon)
          </button>
        </div>
      </div>
    </main>
  );
}