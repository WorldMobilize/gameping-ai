export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black">Privacy Policy</h1>

        <p className="mt-6 text-white/60">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-10 space-y-6 text-white/70 leading-7">
          <p>
            GamePing AI collects minimal user data to provide personalized game recommendations.
          </p>

          <h2 className="text-xl font-bold text-white">Data we collect</h2>
          <ul className="list-disc pl-6">
            <li>Email (only if you create an account)</li>
            <li>Preferences (genres, mood, budget)</li>
          </ul>

          <h2 className="text-xl font-bold text-white">How we use data</h2>
          <ul className="list-disc pl-6">
            <li>Generate AI recommendations</li>
            <li>Send price alerts (if enabled)</li>
          </ul>

          <h2 className="text-xl font-bold text-white">Third-party services</h2>
          <p>
            We use external APIs like OpenAI, RAWG and CheapShark to provide data and recommendations.
          </p>

          <h2 className="text-xl font-bold text-white">Your rights</h2>
          <p>
            You can request deletion of your data at any time by contacting us.
          </p>
        </div>
      </div>
    </main>
  );
}