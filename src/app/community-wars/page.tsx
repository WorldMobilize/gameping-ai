import AppPageShell from "@/components/app/AppPageShell";
import AdminOnlyPageGate from "@/components/discovery/AdminOnlyPageGate";
import CommunityWarsView from "@/components/community-wars/CommunityWarsView";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// Admin-only concept demo — keep it out of search indexes and the sitemap.
// (The client gate also returns notFound() for non-admins, so anonymous
// visitors get a 404, same pattern as /parties.)
export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: "Community Wars | GamePing AI",
    // Deliberately says nothing: the metadata is server-rendered before the
    // admin gate runs, so anyone requesting this URL would read it.
    description: "Admin-only concept demo.",
    path: "/community-wars",
  }),
  robots: { index: false, follow: false },
};

export default function CommunityWarsPage() {
  return (
    <AppPageShell hideAmbient>
      {/* Same treatment as /parties: broader landing identity (cinematic hero
          background + default cyan accent), not a dedicated accent. */}
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <AdminOnlyPageGate>
          <CommunityWarsView />
        </AdminOnlyPageGate>
      </div>
    </AppPageShell>
  );
}
