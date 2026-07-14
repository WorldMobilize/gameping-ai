import AppPageShell from "@/components/app/AppPageShell";
import WorldMobilizeComingSoon from "@/components/worldmobilize/WorldMobilizeComingSoon";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// Locked pre-launch: the route renders a Coming Soon placeholder (not the live
// claim map) and stays out of search indexes and the sitemap. The real view
// (WorldMobilizeClaimView) still exists and is re-enabled at launch.
export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: "World Mobilize | GamePing AI",
    description: "World Mobilize is coming soon to GamePing.",
    path: "/worldmobilize",
  }),
  robots: { index: false, follow: false },
};

export default function WorldMobilizePage() {
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <WorldMobilizeComingSoon />
      </div>
    </AppPageShell>
  );
}
