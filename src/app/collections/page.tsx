import type { Metadata } from "next";
import AppPageShell from "@/components/app/AppPageShell";
import BrowseHubView from "@/components/seo/BrowseHubView";
import { buildPublicPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Curated Collections — Best-of, Genres & Moods | GamePing AI",
  description:
    "Browse GamePing's curated game collections by best-of list, genre, or mood — each pick explained, all leading to recommendations tuned to you.",
  path: "/collections",
});

export default function CollectionsPage() {
  return (
    <AppPageShell hideAmbient>
      <BrowseHubView />
    </AppPageShell>
  );
}
