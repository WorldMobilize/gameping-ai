export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black">Terms & Conditions</h1>

        <p className="mt-6 text-white/60">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-10 space-y-6 text-white/70 leading-7">
          <p>
            By using GamePing AI, you agree to these terms.
          </p>

          <h2 className="text-xl font-bold text-white">Service</h2>
          <p>
            GamePing provides AI-generated game recommendations and price tracking.
          </p>

          <h2 className="text-xl font-bold text-white">No guarantees</h2>
          <p>
            We do not guarantee accuracy of recommendations or prices.
          </p>

          <h2 className="text-xl font-bold text-white">Affiliate links</h2>
          <p>
            Some links may generate revenue for GamePing AI at no extra cost to you.
          </p>

          <h2 className="text-xl font-bold text-white">Accounts</h2>
          <p>
            Users are responsible for maintaining their account security.
          </p>

          <h2 className="text-xl font-bold text-white">Changes</h2>
          <p>
            We may update these terms at any time.
          </p>
        </div>
      </div>
    </main>
  );
}