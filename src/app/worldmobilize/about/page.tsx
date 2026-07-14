import type { Metadata } from "next";
import AppPageShell from "@/components/app/AppPageShell";
import WorldMobilizeComingSoon from "@/components/worldmobilize/WorldMobilizeComingSoon";
import { buildPublicPageMetadata } from "@/lib/seo/site";

// Locked pre-launch: renders a Coming Soon placeholder and is kept out of search
// indexes (was previously indexable — noindex added on purpose) so Google never
// surfaces the World Mobilize overview before the product ships.
export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: "World Mobilize | GamePing AI",
    description: "World Mobilize is coming soon to GamePing.",
    path: "/worldmobilize/about",
  }),
  robots: { index: false, follow: false },
};

export default function WorldMobilizeAboutPage() {
  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <WorldMobilizeComingSoon />
      </div>
    </AppPageShell>
  );
}
