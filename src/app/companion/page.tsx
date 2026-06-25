import AppPageShell from "@/components/app/AppPageShell";
import AdminOnlyPageGate from "@/components/discovery/AdminOnlyPageGate";
import CompanionView from "@/components/companion/CompanionView";
import { buildNoIndexMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// Experimental, admin-only Alpha — never indexed and never in the sitemap. The
// client gate also returns notFound() for non-admins, so anonymous visitors get
// a 404.
export const metadata: Metadata = buildNoIndexMetadata("GamePing Companion | GamePing AI");

export default function CompanionPage() {
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <AdminOnlyPageGate>
          <CompanionView />
        </AdminOnlyPageGate>
      </div>
    </AppPageShell>
  );
}
