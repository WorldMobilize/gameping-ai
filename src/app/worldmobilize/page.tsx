import AppPageShell from "@/components/app/AppPageShell";
import AdminOnlyPageGate from "@/components/discovery/AdminOnlyPageGate";
import WorldMobilizeView from "@/components/worldmobilize/WorldMobilizeView";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// Admin-only concept (Phase 1) — out of search indexes and the sitemap. The
// client gate 404s for non-admins, same pattern as /parties and /community-wars.
export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: "World Mobilize | GamePing AI",
    description:
      "An original fictional world where gaming communities claim regions and compete for territory. GamePing concept — Phase 1 map foundation.",
    path: "/worldmobilize",
  }),
  robots: { index: false, follow: false },
};

export default function WorldMobilizePage() {
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <AdminOnlyPageGate>
          <WorldMobilizeView />
        </AdminOnlyPageGate>
      </div>
    </AppPageShell>
  );
}
