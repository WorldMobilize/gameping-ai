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
  "/disclaimer",
  "Disclaimer",
  "Disclaimers for AI recommendations, pricing data, third-party sources, and external links."
);

export default function DisclaimerPage() {
  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700">Legal</p>
        <h1 className={APP_PAGE_TITLE}>Disclaimer</h1>

        <p className={`mt-4 ${APP_MUTED}`}>Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className={`mt-10 space-y-8 ${APP_BODY}`}>
          <p>
            GamePing AI provides AI-powered video game recommendations and deal-aware price
            lookups. The Service is provided for general informational purposes only.
          </p>

          <div>
            <h2 className={APP_PROSE_HEADING}>AI recommendations</h2>
            <p className="mt-3">
              Recommendations are generated automatically. They may be inaccurate, incomplete, or
              not match your preferences, playstyle, region, platform availability, or other
              constraints. We do not guarantee perfect recommendations.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Third-party game data</h2>
            <p className="mt-3">
              Game metadata may come from third-party sources. We do not control third-party data
              quality and cannot guarantee it is always correct or up to date.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Prices, deals, and availability</h2>
            <p className="mt-3">
              Prices and deals may be inaccurate, delayed, unavailable, or changed by stores at
              any time. Always verify final price and availability on the store before purchasing.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>No affiliation</h2>
            <p className="mt-3">
              GamePing AI is not affiliated with or endorsed by game publishers, platforms, or
              stores unless explicitly stated.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>External links</h2>
            <p className="mt-3">
              The Service may contain links to third-party websites. These external sites are not
              under our control. We are not responsible for their content, policies, pricing, or
              purchase processes.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Affiliate disclosure</h2>
            <p className="mt-3">
              Some outbound links may be affiliate links. This means GamePing AI may earn revenue
              at no additional cost to you. A fuller explanation of independence, rankings, and
              click logging is in our{" "}
              <Link href="/affiliate-disclosure" className={APP_INLINE_LINK}>
                Affiliate disclosure
              </Link>
              .
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
