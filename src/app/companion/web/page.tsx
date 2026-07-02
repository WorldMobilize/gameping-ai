import AppPageShell from "@/components/app/AppPageShell";
import AdminOnlyPageGate from "@/components/discovery/AdminOnlyPageGate";
import CompanionView from "@/components/companion/CompanionView";
import { buildNoIndexMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// In-browser companion tester — same experimental, admin-only Alpha as
// /companion. Never indexed; the client gate 404s non-admins.
export const metadata: Metadata = buildNoIndexMetadata(
  "GamePing Companion (Browser) | GamePing AI"
);

export default function CompanionWebPage() {
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
