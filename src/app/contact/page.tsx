import Link from "next/link";
import type { Metadata } from "next";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_ACCENT,
  APP_BODY_SM,
  APP_CALLOUT,
  APP_CARD_LG,
  APP_CTA_PANEL,
  APP_INLINE_LINK,
  APP_KICKER,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_PRIMARY_CTA_SM,
} from "@/components/app/app-styles";
import { legalPageMetadata } from "@/lib/seo/legal";

export const metadata: Metadata = legalPageMetadata(
  "/contact",
  "Contact",
  "Contact GamePing AI for support, privacy requests, and general inquiries."
);

export default function ContactPage() {
  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-3xl">
        <p className={APP_KICKER}>Support</p>
        <h1 className={APP_PAGE_TITLE}>Contact</h1>

        <p className={APP_PAGE_LEAD}>
          Choose the inbox that best matches your request so we can route it quickly. Include your
          account email (if applicable), browser, and steps to reproduce for bugs.
        </p>

        <div className="mt-10 space-y-6">
          <div className={APP_CARD_LG}>
            <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${APP_ACCENT}`}>
              General support &amp; bugs
            </p>
            <p className={`mt-2 break-all text-lg font-bold ${APP_ACCENT}`}>support@gamepingai.com</p>
            <p className={`mt-2 ${APP_BODY_SM}`}>
              Product questions, troubleshooting, saved searches, recommendations, and technical bug
              reports.
            </p>
          </div>

          <div className={APP_CARD_LG}>
            <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${APP_ACCENT}`}>
              Privacy &amp; data rights
            </p>
            <p className={`mt-2 break-all text-lg font-bold ${APP_ACCENT}`}>privacy@gamepingai.com</p>
            <p className={`mt-2 ${APP_BODY_SM}`}>
              Access, correction, deletion assistance, portability questions, and GDPR/UK GDPR
              requests. For fastest account removal, use{" "}
              <Link href="/settings/account" className={APP_INLINE_LINK}>
                Settings → Account
              </Link>{" "}
              (self-serve deletion).
            </p>
          </div>

          <div className={APP_CARD_LG}>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-slate-400">
              Legal &amp; compliance notices
            </p>
            <p className="mt-2 break-all text-lg font-bold text-slate-900 dark:text-white">legal@gamepingai.com</p>
            <p className={`mt-2 ${APP_BODY_SM}`}>
              Formal legal notices and compliance correspondence (not for routine support).
            </p>
          </div>

          <div className={APP_CARD_LG}>
            <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${APP_ACCENT}`}>
              Billing &amp; refunds
            </p>
            <p className={`mt-2 ${APP_BODY_SM}`}>
              Start with <span className="font-semibold text-slate-900 dark:text-white">support@gamepingai.com</span>{" "}
              and include your billing email and approximate charge date. Premium is billed through
              Stripe; many billing actions are also available from Stripe&apos;s customer emails after
              purchase. See the{" "}
              <Link href="/refund-policy" className={APP_INLINE_LINK}>
                Refund policy
              </Link>
              .
            </p>
          </div>

          <div className={APP_CARD_LG}>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-slate-400">
              Account deletion
            </p>
            <p className={`mt-2 ${APP_BODY_SM}`}>
              Use in-product deletion at{" "}
              <Link href="/settings/account" className={APP_INLINE_LINK}>
                /settings/account
              </Link>{" "}
              for a self-serve, authenticated workflow. If you are locked out, email{" "}
              <span className="font-semibold text-slate-900 dark:text-white">privacy@gamepingai.com</span> from the
              address associated with your account.
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-slate-600 dark:text-slate-400">
          We aim to respond within a reasonable timeframe. During early access, response times may
          vary.
        </p>

        <div className={`mt-10 ${APP_CALLOUT}`}>
          This page is provided for general informational purposes and does not constitute legal
          advice.
        </div>

        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          <Link href="/legal" className={APP_INLINE_LINK}>
            Legal hub
          </Link>
        </p>

        <div className={`mt-14 ${APP_CTA_PANEL} md:flex md:items-center md:justify-between md:gap-8`}>
          <div>
            <p className={APP_KICKER}>Next step</p>
            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
              Ready to discover your next game?
            </p>
          </div>
          <Link href="/recommend" className={`mt-6 md:mt-0 ${APP_PRIMARY_CTA_SM}`}>
            Open GamePing AI
          </Link>
        </div>
      </AppSection>
    </AppPageShell>
  );
}
