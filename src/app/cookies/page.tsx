import Link from "next/link";
import type { Metadata } from "next";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_BODY,
  APP_CALLOUT,
  APP_INLINE_LINK,
  APP_KICKER,
  APP_MUTED,
  APP_PAGE_TITLE,
  APP_PROSE_HEADING,
} from "@/components/app/app-styles";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-last-updated";
import { legalPageMetadata } from "@/lib/seo/legal";

export const metadata: Metadata = legalPageMetadata(
  "/cookies",
  "Cookie Policy",
  "How GamePing AI uses essential and optional cookies and how you can control them."
);

export default function CookiesPage() {
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <AppSection maxWidth="max-w-3xl">
        <p className={APP_KICKER}>Legal</p>
        <h1 className={APP_PAGE_TITLE}>Cookie Policy</h1>

        <p className={`mt-4 ${APP_MUTED}`}>Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className={`mt-10 space-y-8 ${APP_BODY}`}>
          <p>
            This Cookie Policy explains how GamePing AI uses cookies and similar technologies
            (including closely related local storage keys where noted).
          </p>

          <div>
            <h2 className={APP_PROSE_HEADING}>Essential cookies (required)</h2>
            <p className="mt-3">
              Essential cookies are needed for core functionality, including authentication,
              session continuity, CSRF protections where applicable, and security. Without them,
              sign-in, your dashboard, and saved searches will not work reliably.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Optional cookies &amp; analytics</h2>
            <p className="mt-3">
              As of the last updated date above, the GamePing codebase does not load third-party
              marketing analytics SDKs (for example Google Analytics) based on our current
              implementation. If we add optional analytics in the future, we will update this policy
              and, where required, align consent mechanics with the feature.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Cookie banner &amp; localStorage</h2>
            <p className="mt-3">
              Our cookie banner stores your choice in browser{" "}
              <span className="font-mono text-slate-700 dark:text-slate-200">localStorage</span> under the key{" "}
              <span className="font-mono text-slate-700 dark:text-slate-200">cookie_consent</span> (values such as
              &quot;accepted&quot; or &quot;rejected&quot;). This is not a tracking cookie, but it
              is a client-side record of your preference. You can clear it anytime via browser
              settings.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>Third-party cookies</h2>
            <p className="mt-3">
              When you authenticate, pay, or interact with embedded flows, third parties such as
              Supabase (auth/session), Stripe (checkout), or email providers may set or read their
              own cookies strictly as needed to deliver those services. We do not control their
              cookie names or lifetimes; refer to their policies for detail.
            </p>
          </div>

          <div>
            <h2 className={APP_PROSE_HEADING}>How to control cookies</h2>
            <p className="mt-3">
              You can block or delete cookies via browser settings. Blocking essential cookies may
              prevent login and other features from working. You can also use private/incognito
              modes for ephemeral sessions (with reduced convenience).
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
      </div>
    </AppPageShell>
  );
}
