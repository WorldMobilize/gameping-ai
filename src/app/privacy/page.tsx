import Link from "next/link";
import type { Metadata } from "next";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_BODY,
  APP_CALLOUT,
  APP_INLINE_LINK,
  APP_MUTED,
  APP_PAGE_TITLE,
  APP_PROSE_HEADING,
} from "@/components/app/app-styles";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-last-updated";
import { legalPageMetadata } from "@/lib/seo/legal";

export const metadata: Metadata = legalPageMetadata(
  "/privacy",
  "Privacy Policy",
  "How GamePing AI collects, uses, stores, and protects your personal data."
);

export default function PrivacyPage() {
  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700">Legal</p>
        <h1 className={APP_PAGE_TITLE}>Privacy Policy</h1>

        <p className={`mt-4 ${APP_MUTED}`}>Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className={`mt-10 space-y-8 ${APP_BODY}`}>
          <p>
            GamePing AI provides AI-powered video game recommendations and deal-aware price
            lookups. This policy explains what personal data we process, why we process it, how
            long we keep it, and the rights you may have depending on your jurisdiction (including
            the UK/EEA under the UK GDPR / GDPR where applicable).
          </p>

          <div>
            <h2 className={APP_PROSE_HEADING}>Who we are</h2>
            <p className="mt-3">
              The service is operated as GamePing AI. For privacy requests, contact{" "}
              <span className="font-bold text-slate-900">privacy@gamepingai.com</span> (preferred for
              privacy-specific requests) or{" "}
              <span className="font-bold text-slate-900">support@gamepingai.com</span> for general
              support.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Data we process</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <span className="font-bold text-slate-900">Account &amp; authentication</span>: email
                address, session tokens/cookies via Supabase Auth, and basic profile fields stored
                in our database (for example plan tier and account email on your profile row).
              </li>
              <li>
                <span className="font-bold text-slate-900">Saved recommendation runs</span>: the
                preferences, budgets, tags, and generated results you choose to save to your
                dashboard.
              </li>
              <li>
                <span className="font-bold text-slate-900">Recommendation inputs</span>: free-text
                prompts and structured filters you submit to generate recommendations.
              </li>
              <li>
                <span className="font-bold text-slate-900">Tracked games &amp; alerts</span>: titles
                (and optional identifiers such as RAWG IDs) you ask us to watch for price-related
                notifications, plus operational fields used to run checks and avoid duplicate
                emails.
              </li>
              <li>
                <span className="font-bold text-slate-900">Outbound clicks</span>: when you use our
                outbound redirect to a store, we may log minimal metadata (for example store,
                game title, and destination) including whether you were signed in—see our{" "}
                <Link href="/affiliate-disclosure" className={APP_INLINE_LINK}>
                  Affiliate disclosure
                </Link>
                .
              </li>
              <li>
                <span className="font-bold text-slate-900">Optional marketing / waitlist email</span>:
                if you submit an email through optional flows, we store what you submit for that
                purpose.
              </li>
              <li>
                <span className="font-bold text-slate-900">Technical &amp; security logs</span>:
                limited operational logs (for example errors and abuse-prevention signals) as
                needed to run the service. We do not sell your personal information.
              </li>
              <li>
                <span className="font-bold text-slate-900">Payments</span>: if you subscribe to
                Premium, Stripe processes payment data. We do not store your full card number on
                GamePing servers.
              </li>
            </ul>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Lawful bases (UK/EEA-style framing)</h2>
            <p className="mt-3">
              Where GDPR/UK GDPR applies, we rely on appropriate lawful bases, commonly including:{" "}
              <span className="font-bold text-slate-900">contract</span> (providing the service you
              request, including accounts, saved searches, and recommendations),{" "}
              <span className="font-bold text-slate-900">legitimate interests</span> (securing the
              product, debugging, understanding aggregated usage, preventing abuse, and
              improving reliability—balanced against your rights), and{" "}
              <span className="font-bold text-slate-900">consent</span> where we ask for it (for
              example non-essential cookies or optional communications when consent is the
              appropriate basis). We may also process certain data where required to comply with{" "}
              <span className="font-bold text-slate-900">legal obligations</span>.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>How we use data</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Provide and operate the service (login, saved searches, dashboard, tracking).</li>
              <li>Generate AI recommendations from your inputs and configured game metadata.</li>
              <li>Look up prices/deals using third-party providers and present outbound store links.</li>
              <li>Prevent abuse, enforce limits, maintain security, and troubleshoot issues.</li>
              <li>Send transactional emails (for example price alerts) when you enable flows that use email.</li>
            </ul>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Processors &amp; international transfers</h2>
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
            <h2 className={APP_PROSE_HEADING}>Data minimization</h2>
            <p className="mt-3">
              We aim to collect only what is reasonably necessary to provide the features you use.
              You can reduce data processed by not creating an account, not saving searches, not
              tracking games, and not opting into optional communications.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Retention</h2>
            <p className="mt-3">
              We retain personal data only as long as needed to provide the service, comply with
              law, resolve disputes, and meet legitimate operational needs (for example short-term
              security logs). Saved searches and tracked-game records remain until you delete them
              or delete your account. Some technical logs may be retained for a limited period even
              after you stop using a feature.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Account deletion &amp; your rights</h2>
            <p className="mt-3">
              You can delete individual saved searches from your dashboard. To delete your entire
              account and associated GamePing records tied to your user ID, use{" "}
              <Link href="/settings/account" className={APP_INLINE_LINK}>
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
              <span className="font-bold text-slate-900">privacy@gamepingai.com</span>. We may need to
              verify your request to protect your account.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Security</h2>
            <p className="mt-3">
              We use industry-standard practices appropriate to the risk, including transport
              encryption (HTTPS), authenticated access controls for user data, and reputable
              infrastructure providers. No method of transmission or storage is 100% secure; we
              cannot guarantee absolute security.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Cookies &amp; local storage</h2>
            <p className="mt-3">
              We use essential cookies for authentication/session management. We may store a
              consent preference locally (for example in{" "}
              <span className="font-mono text-slate-600">localStorage</span>) for the cookie banner.
              See the{" "}
              <Link href="/cookies" className={APP_INLINE_LINK}>
                Cookie Policy
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Children</h2>
            <p className="mt-3">
              GamePing is not directed to children under the age required by applicable law to
              consent to data processing in their region. Do not use the service if you do not
              meet the minimum age requirement in your jurisdiction.
            </p>
          </div>

          <p className={APP_MUTED}>
            <Link href="/legal" className={APP_INLINE_LINK}>
              Legal hub
            </Link>
          </p>

          <div className={APP_CALLOUT}>
            This page is provided for general informational purposes and does not constitute legal
            advice.
          </div>
        </div>
      </AppSection>
    </AppPageShell>
  );
}
