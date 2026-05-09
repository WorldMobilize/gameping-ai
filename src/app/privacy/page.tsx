import Navbar from "@/components/Navbar";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Privacy Policy</h1>

          <p className="mt-4 text-sm text-white/55">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="mt-10 space-y-8 text-white/70 leading-7">
            <p>
              GamePing AI provides AI-powered video game recommendations and deal-aware price lookups.
              This policy explains what data we collect, how we use it, and your choices.
            </p>

            <div>
              <h2 className="text-xl font-black text-white">Data we may collect</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <span className="font-bold text-white">Account data</span>: email address and basic
                  profile info when you create an account.
                </li>
                <li>
                  <span className="font-bold text-white">Saved searches</span>: saved preferences,
                  budgets, and generated results you choose to store.
                </li>
                <li>
                  <span className="font-bold text-white">Recommendation inputs</span>: the queries
                  and tags you provide to generate recommendations.
                </li>
                <li>
                  <span className="font-bold text-white">Usage data</span>: basic diagnostics and
                  product usage signals (for example, error logs). Analytics may be enabled depending
                  on your deployment configuration.
                </li>
                <li>
                  <span className="font-bold text-white">Payment data</span>: if you subscribe to
                  Premium, payment processing is handled by Stripe. We do not store full card details
                  on our servers.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">How we use data</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Provide and operate the service (login, saved searches, dashboard).</li>
                <li>Generate AI recommendations based on your request and preferences.</li>
                <li>Look up prices/deals using third-party providers.</li>
                <li>Prevent abuse, maintain security, and troubleshoot issues.</li>
                <li>Send service communications and alerts if you opt in (where available).</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Third-party services</h2>
              <p className="mt-3">
                GamePing AI may use third-party services to provide functionality, including (as
                configured): Supabase (authentication and data storage), OpenAI (AI generation), RAWG
                (game metadata), CheapShark (price data), Stripe (payments), and analytics/email
                providers.
              </p>
              <p className="mt-3">
                Prices and deals come from third-party sources and may change. Always verify final
                pricing and availability on the store before purchasing.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Cookies</h2>
              <p className="mt-3">
                We use essential cookies for authentication/session management and basic site
                functionality. Optional analytics cookies may be used if enabled. See the{" "}
                <a href="/cookies" className="font-bold text-cyan-300 hover:underline">
                  Cookie Policy
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Data retention</h2>
              <p className="mt-3">
                We retain data only as long as needed to provide the service and meet legal or
                operational requirements. Saved searches remain until you delete them or close your
                account (where supported).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Your rights & choices</h2>
              <p className="mt-3">
                Depending on your location, you may have rights to access, correct, export, or
                delete your data. You can contact us to request help with these actions.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Contact</h2>
              <p className="mt-3">
                For privacy requests or questions, email{" "}
                <span className="font-bold text-white">support@gamepingai.com</span>.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">
              This page is provided for general informational purposes and does not constitute legal
              advice.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}