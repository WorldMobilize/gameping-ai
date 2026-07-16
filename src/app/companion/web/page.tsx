import AppPageShell from "@/components/app/AppPageShell";
import CompanionView from "@/components/companion/CompanionView";
import { buildNoIndexMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// In-browser Companion tester. Open, like the rest of Companion — and safe to be:
// the endpoint behind it (/api/companion/ask) authenticates every call with Supabase,
// so a signed-out visitor can open the page but cannot spend a cent of OpenAI credit.
// Noindex: it is a tool, not a landing page.
export const metadata: Metadata = buildNoIndexMetadata(
  "GamePing Companion (Browser) | GamePing AI"
);

export default function CompanionWebPage() {
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <CompanionView />
      </div>
    </AppPageShell>
  );
}
