import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-last-updated";
import { legalPageMetadata } from "@/lib/seo/legal";

export const metadata: Metadata = legalPageMetadata(
  "/terms",
  "Terms of Service",
  "Terms and conditions for using GamePing AI, including subscriptions and acceptable use."
);

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">Legal</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Terms of Service</h1>

          <p className="mt-4 text-sm text-white/55">Last updated: {LEGAL_LAST_UPDATED}</p>

          <div className="mt-10 space-y-8 text-white/70 leading-7">
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of GamePing
              AI (the &quot;Service&quot;). By creating an account, clicking to accept, or using the
              Service, you agree to these Terms. If you do not agree, do not use the Service.
            </p>

            <div>
              <h2 className="text-xl font-black text-white">1. The Service</h2>
              <p className="mt-3">
                GamePing AI provides AI-assisted game discovery, game metadata, and best-effort
                deal-aware price information. The Service is informational and entertainment-oriented;
                it is not professional advice (legal, financial, medical, or otherwise).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">2. Eligibility</h2>
              <p className="mt-3">
                You must be old enough to form a binding contract in your jurisdiction and meet any
                minimum age required by applicable law (including rules related to children&apos;s
                privacy) to use the Service. If you are using the Service on behalf of an
                organization, you represent that you have authority to bind that organization.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">3. AI outputs are probabilistic</h2>
              <p className="mt-3">
                Recommendations are generated using probabilistic models and third-party data. Outputs
                may be wrong, incomplete, outdated, biased, or not suitable for you.{" "}
                <span className="font-bold text-white">
                  Use recommendations at your own discretion
                </span>
                . You are solely responsible for what you play, install, or purchase.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">4. Prices, deals, and store availability</h2>
              <p className="mt-3">
                Pricing and availability come from third parties and can change without notice.
                Retailers control checkout, taxes, regional restrictions, refunds, and fulfillment.
                GamePing does not guarantee any price, discount, stock status, or that a link will
                always resolve to a valid offer.{" "}
                <span className="font-bold text-white">
                  Always verify final price and purchase terms on the store before buying.
                </span>
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">5. Accounts and security</h2>
              <p className="mt-3">
                You are responsible for safeguarding your credentials and for activity under your
                account. Notify us promptly at{" "}
                <span className="font-bold text-white">support@gamepingai.com</span> if you suspect
                unauthorized access.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">6. Account deletion</h2>
              <p className="mt-3">
                You may delete your account and associated Service data through{" "}
                <Link href="/settings/account" className="font-bold text-cyan-300 hover:underline">
                  Settings → Account
                </Link>
                . Deletion is irreversible for data we control in GamePing&apos;s systems. See the{" "}
                <Link href="/privacy" className="font-bold text-cyan-300 hover:underline">
                  Privacy Policy
                </Link>{" "}
                for details and limitations (for example third-party processors and billing
                records retained by payment providers).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">7. Premium subscription</h2>
              <p className="mt-3">
                Premium features may be offered as a recurring subscription where available. Payments
                are processed by Stripe.{" "}
                <span className="font-bold text-white">
                  Premium features, limits, and pricing may change over time
                </span>
                ; we will aim to communicate material changes in a reasonable manner, but continued
                use after changes may constitute acceptance as described in the Changes section
                below.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">8. Acceptable use</h2>
              <p className="mt-3">You agree not to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Violate applicable law or infringe others&apos; rights.</li>
                <li>Attempt to probe, scan, or test the vulnerability of the Service without permission.</li>
                <li>Interfere with or disrupt the Service, networks, or security systems.</li>
                <li>
                  Circumvent or abuse rate limits, access controls, authentication, or billing
                  mechanisms.
                </li>
                <li>
                  Use bots, scrapers, or automation to extract data from the Service at scale without
                  our prior written consent (reasonable personal scripts that mimic normal human use
                  may still be prohibited if they harm performance or violate security).
                </li>
                <li>Misrepresent your identity, manipulate rankings, or send deceptive requests.</li>
                <li>Use the Service to develop a competing model by systematically harvesting outputs.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">9. Service availability</h2>
              <p className="mt-3">
                The Service may be modified, suspended, or discontinued at any time. Third-party APIs
                and infrastructure may experience outages.{" "}
                <span className="font-bold text-white">
                  We do not guarantee uptime, error-free operation, or uninterrupted access.
                </span>
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">10. Termination and suspension</h2>
              <p className="mt-3">
                We may suspend or terminate access to the Service if we reasonably believe you
                violated these Terms, created risk or possible legal exposure, or must do so to comply
                with law. You may stop using the Service at any time. Provisions that by their
                nature should survive (for example disclaimers, limitations, indemnities) survive
                termination.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">11. Intellectual property</h2>
              <p className="mt-3">
                The Service, branding, and original content are owned by GamePing AI or its
                licensors. Game titles, logos, screenshots, and trademarks belong to their respective
                owners. No license to third-party IP is granted except what is necessary to use the
                Service as offered.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">12. Disclaimers</h2>
              <p className="mt-3">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; TO THE
                MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS,
                IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">13. Limitation of liability</h2>
              <p className="mt-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, GAMEPING AI AND ITS SUPPLIERS WILL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE
                DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING
                OUT OF OR RELATED TO YOUR USE OF THE SERVICE. TO THE MAXIMUM EXTENT PERMITTED BY LAW,
                OUR AGGREGATE LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THE SERVICE WILL
                NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID TO GAMEPING FOR THE SERVICE IN THE
                TWELVE (12) MONTHS BEFORE THE CLAIM OR (B) FIFTY US DOLLARS (US$50).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">14. Indemnification</h2>
              <p className="mt-3">
                You will defend, indemnify, and hold harmless GamePing AI and its affiliates,
                directors, employees, and agents from and against any claims, damages, losses,
                liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising
                out of or related to your use of the Service, your content/inputs, or your violation
                of these Terms or applicable law—except to the extent a claim arises from our gross
                negligence or willful misconduct (where such exclusion is enforceable).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">15. Governing law &amp; jurisdiction</h2>
              <p className="mt-3">
                These Terms are governed by the laws of the jurisdiction stated in your commercial
                agreement with GamePing, or otherwise by the laws applicable to the operating entity,
                <span className="font-bold text-white"> excluding conflict-of-law rules</span>. You
                agree to the exclusive jurisdiction and venue of the courts in that jurisdiction for
                disputes—unless mandatory consumer protections in your country require otherwise.
                If you are a consumer, nothing in this section limits rights you cannot waive by
                contract under local law.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">16. Changes</h2>
              <p className="mt-3">
                We may update these Terms from time to time. If changes are material, we will take
                reasonable steps to notify you (for example by posting an updated date and/or a
                notice in-product). Continued use after the effective date may constitute acceptance.
                If you do not agree, stop using the Service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">17. Contact</h2>
              <p className="mt-3">
                Questions about these Terms? Email{" "}
                <span className="font-bold text-white">support@gamepingai.com</span> or{" "}
                <span className="font-bold text-white">legal@gamepingai.com</span>.
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
