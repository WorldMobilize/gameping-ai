import AppPageShell from "@/components/app/AppPageShell";
import AdminOnlyPageGate from "@/components/discovery/AdminOnlyPageGate";
import PartiesView from "@/components/parties/PartiesView";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// Admin-only / future feature — keep it out of search indexes. (The client gate
// also returns notFound() for non-admins, so anonymous visitors get a 404.)
export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: "GamePing Parties | GamePing AI",
    description:
      "Find players for the games you already own — co-op nights, ranked squads, survival servers, and weekend sessions. A future GamePing feature.",
    path: "/parties",
  }),
  robots: { index: false, follow: false },
};

export default function PartiesPage() {
  return (
    <AppPageShell hideAmbient>
      {/* Lives under the broader landing identity: cinematic hero background +
          cyan accent (default page accent), not a dedicated Parties accent. */}
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <AdminOnlyPageGate>
          <PartiesView />
        </AdminOnlyPageGate>
      </div>
    </AppPageShell>
  );
}
