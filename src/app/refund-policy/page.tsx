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
  "/refund-policy",
  "Refund Policy",
  "Refund and cancellation terms for GamePing AI paid subscriptions."
);

export default function RefundPolicyPage() {
  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700">Legal</p>
        <h1 className={APP_PAGE_TITLE}>Refund Policy</h1>

        <p className={`mt-4 ${APP_MUTED}`}>Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className={`mt-10 space-y-8 ${APP_BODY}`}>
          <p>
            This Refund Policy describes how refunds are handled for paid subscriptions to GamePing
            AI.
          </p>

          <div>
            <h2 className={APP_PROSE_HEADING}>Subscriptions</h2>
            <p className="mt-3">
              Premium is offered as a monthly subscription (where available). You can cancel your
              subscription at any time. Cancellation stops future renewals; access may continue
              until the end of the current billing period depending on how the subscription is
              configured.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Refunds</h2>
            <p className="mt-3">
              Refunds are handled on a case-by-case basis unless required by applicable law. If
              you believe you were charged incorrectly or experienced a billing issue, contact
              support with your account email and relevant details.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Payment processing</h2>
            <p className="mt-3">
              Payments are processed by Stripe. We do not store your full card details. Any refunds
              (if approved) are issued through Stripe to the original payment method where
              possible.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Contact</h2>
            <p className="mt-3">
              Email{" "}
              <span className="font-bold text-slate-900">support@gamepingai.com</span> for billing or
              refund questions.
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
