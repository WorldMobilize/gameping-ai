import Link from "next/link";
import Navbar from "@/components/Navbar";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-last-updated";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">Legal</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Privacy Policy</h1>

          <p className="mt-4 text-sm text-white/55">Last updated: {LEGAL_LAST_UPDATED}</p>

          <div className="mt-10 space-y-8 text-white/70 leading-7">
            <p>
              GamePing AI provides AI-powered video game recommendations and deal-aware price
              lookups. This policy explains what personal data we process, why we process it, how
              long we keep it, and the rights you may have depending on your jurisdiction (including
              the UK/EEA under the UK GDPR / GDPR where applicable).
            </p>

            <div>
              <h2 className="text-xl font-black text-white">Who we are</h2>
              <p className="mt-3">
                The service is operated as GamePing AI. For privacy requests, contact{" "}
                <span className="font-bold text-white">privacy@gamepingai.com</span> (preferred for
                privacy-specific requests) or{" "}
                <span className="font-bold text-white">support@gamepingai.com</span> for general
                support.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Data we process</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <span className="font-bold text-white">Account &amp; authentication</span>: email
                  address, session tokens/cookies via Supabase Auth, and basic profile fields stored
                  in our database (for example plan tier and account email on your profile row).
                </li>
                <li>
                  <span className="font-bold text-white">Saved recommendation runs</span>: the
                  preferences, budgets, tags, and generated results you choose to save to your
                  dashboard.
                </li>
                <li>
                  <span className="font-bold text-white">Recommendation inputs</span>: free-text
                  prompts and structured filters you submit to generate recommendations.
                </li>
                <li>
                  <span className="font-bold text-white">Tracked games &amp; alerts</span>: titles
                  (and optional identifiers such as RAWG IDs) you ask us to watch for price-related
                  notifications, plus operational fields used to run checks and avoid duplicate
                  emails.
                </li>
                <li>
                  <span className="font-bold text-white">Outbound clicks</span>: when you use our
                  outbound redirect to a store, we may log minimal metadata (for example store,
                  game title, and destination) including whether you were signed in—see our{" "}
                  <Link href="/affiliate-disclosure" className="font-bold text-cyan-300 hover:underline">
                    Affiliate disclosure
                  </Link>
                  .
                </li>
                <li>
                  <span className="font-bold text-white">Optional marketing / waitlist email</span>:
                  if you submit an email through optional flows, we store what you submit for that
                  purpose.
                </li>
                <li>
                  <span className="font-bold text-white">Technical &amp; security logs</span>:
                  limited operational logs (for example errors and abuse-prevention signals) as
                  needed to run the service. We do not sell your personal information.
                </li>
                <li>
                  <span className="font-bold text-white">Payments</span>: if you subscribe to
                  Premium, Stripe processes payment data. We do not store your full card number on
                  GamePing servers.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Lawful bases (UK/EEA-style framing)</h2>
              <p className="mt-3">
                Where GDPR/UK GDPR applies, we rely on appropriate lawful bases, commonly including:{" "}
                <span className="font-bold text-white">contract</span> (providing the service you
                request, including accounts, saved searches, and recommendations),{" "}
                <span className="font-bold text-white">legitimate interests</span> (securing the
                product, debugging, understanding aggregated usage, preventing abuse, and
                improving reliability—balanced against your rights), and{" "}
                <span className="font-bold text-white">consent</span> where we ask for it (for
                example non-essential cookies or optional communications when consent is the
                appropriate basis). We may also process certain data where required to comply with{" "}
                <span className="font-bold text-white">legal obligations</span>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">How we use data</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Provide and operate the service (login, saved searches, dashboard, tracking).</li>
                <li>Generate AI recommendations from your inputs and configured game metadata.</li>
                <li>Look up prices/deals using third-party providers and present outbound store links.</li>
                <li>Prevent abuse, enforce limits, maintain security, and troubleshoot issues.</li>
                <li>Send transactional emails (for example price alerts) when you enable flows that use email.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Processors &amp; international transfers</h2>
              <p className="mt-3">
                We use third-party services to operate GamePing, including (as configured): Supabase
                (authentication and database storage), OpenAI (AI generation), RAWG (game metadata),
                CheapShark and related pricing sources (deal/price data), Stripe (payments), email
                delivery (for example via Resend for certain flows), and infrastructure providers
                (for example hosting). These providers may process data in the United States or other
                countries. Where required, we rely on appropriate safeguards such as Standard
                Contractual Clauses (SCCs) offered by vendors, in addition to their terms and privacy
                policies.
              </p>
              <p className="mt-3">
                Prices and deals come from third-party sources and may change. Always verify final
                pricing and availability on the store before purchasing.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Data minimization</h2>
              <p className="mt-3">
                We aim to collect only what is reasonably necessary to provide the features you use.
                You can reduce data processed by not creating an account, not saving searches, not
                tracking games, and not opting into optional communications.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Retention</h2>
              <p className="mt-3">
                We retain personal data only as long as needed to provide the service, comply with
                law, resolve disputes, and meet legitimate operational needs (for example short-term
                security logs). Saved searches and tracked-game records remain until you delete them
                or delete your account. Some technical logs may be retained for a limited period even
                after you stop using a feature.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Account deletion &amp; your rights</h2>
              <p className="mt-3">
                You can delete individual saved searches from your dashboard. To delete your entire
                account and associated GamePing records tied to your user ID, use{" "}
                <Link href="/settings/account" className="font-bold text-cyan-300 hover:underline">
                  Settings → Account
                </Link>{" "}
                (Danger zone). Account deletion is irreversible and removes your auth user and
                associated application data we store for that account (including saved searches,
                tracked games, profile row, outbound-click rows linked to your user, and related
                operational records where applicable). It does not automatically cancel an active
                Stripe subscription—cancel billing in Stripe if needed.
              </p>
              <p className="mt-3">
                Depending on your location, you may have rights to access, rectify, erase, restrict
                processing, object, or port data, and to lodge a complaint with a supervisory
                authority. To exercise rights or ask questions, email{" "}
                <span className="font-bold text-white">privacy@gamepingai.com</span>. We may need to
                verify your request to protect your account.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Security</h2>
              <p className="mt-3">
                We use industry-standard practices appropriate to the risk, including transport
                encryption (HTTPS), authenticated access controls for user data, and reputable
                infrastructure providers. No method of transmission or storage is 100% secure; we
                cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Cookies &amp; local storage</h2>
              <p className="mt-3">
                We use essential cookies for authentication/session management. We may store a
                consent preference locally (for example in{" "}
                <span className="font-mono text-white/80">localStorage</span>) for the cookie banner.
                See the{" "}
                <Link href="/cookies" className="font-bold text-cyan-300 hover:underline">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Children</h2>
              <p className="mt-3">
                GamePing is not directed to children under the age required by applicable law to
                consent to data processing in their region. Do not use the service if you do not
                meet the minimum age requirement in your jurisdiction.
              </p>
            </div>

            <p className="text-sm text-white/50">
              <Link href="/legal" className="font-semibold text-cyan-300 hover:underline">
                Legal hub
              </Link>
            </p>

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
