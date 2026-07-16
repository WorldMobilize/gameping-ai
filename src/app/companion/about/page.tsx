import type { Metadata } from "next";
import AppPageShell from "@/components/app/AppPageShell";
import CompanionAboutView from "@/components/companion/CompanionAboutView";
import { buildPublicPageMetadata } from "@/lib/seo/site";

// Detailed, non-technical breakdown of what Companion does TODAY. The old copy
// (via the shared ProductOverviewView template) advertised voice, maps and
// walkthroughs as "Next" — but voice (Alt+M) and video/image/music answers are
// already live, so the roadmap framing understated the alpha. This page now
// describes only what exists, with a dedicated "known limitations" section.
export const metadata: Metadata = buildPublicPageMetadata({
  title: "How Companion works — the desktop overlay in alpha | GamePing AI",
  description:
    "The full picture of GamePing Companion: an in-game overlay with voice and rich-media answers, follow-up conversations, a desktop dashboard, and honest alpha limitations. Windows, alpha.",
  path: "/companion/about",
});

export default function CompanionAboutPage() {
  return (
    <AppPageShell hideAmbient>
      <div className="relative isolate min-h-0 flex-1" style={{ backgroundColor: "var(--gp-bg-base)" }}>
        <CompanionAboutView />
      </div>
    </AppPageShell>
  );
}
