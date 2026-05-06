export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-[#05060f] px-6 py-20 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black">Disclaimer</h1>

        <p className="mt-6 text-white/60">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-10 space-y-6 leading-7 text-white/70">
          <p>
            GamePing AI provides AI-generated video game recommendations and
            price information for convenience only.
          </p>

          <h2 className="text-xl font-bold text-white">Recommendations</h2>
          <p>
            Recommendations are generated automatically and may not always match
            your expectations, preferences or platform availability.
          </p>

          <h2 className="text-xl font-bold text-white">Prices and availability</h2>
          <p>
            Prices, discounts and availability may change at any time. GamePing
            AI does not guarantee that displayed prices are always accurate,
            current or available at checkout.
          </p>

          <h2 className="text-xl font-bold text-white">External links</h2>
          <p>
            GamePing AI may link to third-party stores or websites. We are not
            responsible for their content, pricing, policies or purchase process.
          </p>

          <h2 className="text-xl font-bold text-white">Affiliate disclosure</h2>
          <p>
            Some outbound links may be affiliate links. This means GamePing AI
            may earn a commission at no additional cost to you.
          </p>
        </div>
      </div>
    </main>
  );
}