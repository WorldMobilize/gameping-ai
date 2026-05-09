import Navbar from "@/components/Navbar";

export default function TermsPage() {
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
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Terms of Service</h1>

          <p className="mt-4 text-sm text-white/55">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="mt-10 space-y-8 text-white/70 leading-7">
            <p>
              These Terms of Service govern your use of GamePing AI (the “Service”). By accessing or
              using the Service, you agree to these Terms.
            </p>

            <div>
              <h2 className="text-xl font-black text-white">1. The Service</h2>
              <p className="mt-3">
                GamePing AI provides AI-powered game recommendations, game metadata, and deal-aware
                price lookups. Recommendations are informational and are not professional advice.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">2. AI outputs and limitations</h2>
              <p className="mt-3">
                AI-generated recommendations may be inaccurate, incomplete, or not match your
                preferences. You are responsible for deciding what to play or purchase.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">3. Prices, deals, and availability</h2>
              <p className="mt-3">
                Prices and deals may come from third-party providers and may change at any time.
                GamePing AI does not guarantee availability, accuracy, or timeliness of pricing
                information. Always verify final prices on the store before purchasing.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">4. Accounts and security</h2>
              <p className="mt-3">
                If you create an account, you are responsible for maintaining the confidentiality of
                your account credentials and for all activity under your account.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">5. Premium subscription</h2>
              <p className="mt-3">
                Premium features may be offered as a monthly subscription. Payments and billing are
                handled by Stripe. Subscription availability, pricing, and features may change over
                time.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">6. Acceptable use</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Do not misuse the Service or attempt to disrupt it.</li>
                <li>Do not attempt to bypass rate limits or access restrictions.</li>
                <li>Do not use the Service for unlawful purposes.</li>
                <li>Do not scrape or copy content at scale without permission.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">7. Intellectual property</h2>
              <p className="mt-3">
                The Service and its content are protected by intellectual property laws. Third-party
                trademarks and game assets belong to their respective owners.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">8. Disclaimers</h2>
              <p className="mt-3">
                The Service is provided “as is” and “as available.” To the maximum extent permitted
                by law, we disclaim all warranties, express or implied.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">9. Limitation of liability</h2>
              <p className="mt-3">
                To the maximum extent permitted by law, GamePing AI will not be liable for indirect,
                incidental, special, consequential, or punitive damages, or any loss of data,
                revenue, or profits, arising from your use of the Service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">10. Changes</h2>
              <p className="mt-3">
                We may update these Terms from time to time. Continued use of the Service after
                changes become effective means you accept the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">11. Contact</h2>
              <p className="mt-3">
                Questions about these Terms? Email{" "}
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