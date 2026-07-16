import AppPageShell from "@/components/app/AppPageShell";
import CompanionDownloadView from "@/components/companion/CompanionDownloadView";
import { buildNoIndexMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// The download + connect hub; the in-browser tester lives at /companion/web.
//
// Open to everyone: Companion ships with the site. It carries no admin gate, and one
// would be theatre anyway — the installer is a public object in Supabase Storage and
// /api/companion/releases/latest publishes its URL, so anybody can fetch the .msi
// whatever this page does. If it ever needs to be paid-only, that is a change to the
// bucket and the release endpoint, not to this file.
//
// Still noindex: a download hub is not a page anyone should land on from a search.
export const metadata: Metadata = buildNoIndexMetadata("GamePing Companion | GamePing AI");

export default function CompanionPage() {
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <CompanionDownloadView />
      </div>
    </AppPageShell>
  );
}
