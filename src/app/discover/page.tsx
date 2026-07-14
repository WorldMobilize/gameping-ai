import type { Metadata } from "next";
import AppPageShell from "@/components/app/AppPageShell";
import DiscoverHubView from "@/components/discover/DiscoverHubView";
import { buildPublicPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Discovery — Every way to find your next game | GamePing AI",
  description:
    "Discovery is GamePing's suite of AI-powered tools for finding games: recommendations, curated collections, hidden gems, weekly picks, and deals matched to your taste.",
  path: "/discover",
});

export default function DiscoverPage() {
  return (
    <AppPageShell hideAmbient>
      <DiscoverHubView />
    </AppPageShell>
  );
}
