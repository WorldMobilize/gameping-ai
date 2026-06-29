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
  "/affiliate-disclosure",
  "Affiliate Disclosure",
  "How GamePing AI may earn from affiliate links when you purchase through deal listings."
);

export default function AffiliateDisclosurePage() {
  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700 dark:text-violet-300">Legal</p>
        <h1 className={APP_PAGE_TITLE}>Affiliate disclosure</h1>

        <p className={`mt-4 ${APP_MUTED}`}>Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className={`mt-10 space-y-8 ${APP_BODY}`}>
          <p>
            GamePing AI may earn a commission when you purchase through certain outbound links to
            third-party stores. Where applicable, affiliate parameters are applied at no extra cost
            to you—the price you see on the store is set by the retailer, not by GamePing.
          </p>

          <div>
            <h2 className={APP_PROSE_HEADING}>Independence of recommendations</h2>
            <p className="mt-3">
              AI recommendations and match scores are not “paid placements” unless we explicitly
              label otherwise in the product. Affiliate relationships do not guarantee rankings,
              match percentages, or that a specific deal will remain available or at a given price.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Accuracy &amp; store responsibility</h2>
            <p className="mt-3">
              Stores control final pricing, taxes, regional availability, and checkout. Always
              verify details on the retailer&apos;s site before you buy. GamePing surfaces
              third-party deal data as a convenience only.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Outbound tracking</h2>
            <p className="mt-3">
              When you leave GamePing through our outbound redirect, we may log a minimal click
              record (for example destination and context) to understand product usage and improve
              transparency around affiliate traffic. See the{" "}
              <Link href="/privacy" className={APP_INLINE_LINK}>
                Privacy Policy
              </Link>{" "}
              for how personal data is handled.
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
