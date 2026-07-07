import { notFound } from "next/navigation";
import AppPageShell from "@/components/app/AppPageShell";
import AdminOnlyPageGate from "@/components/discovery/AdminOnlyPageGate";
import CityView from "@/components/worldmobilize/city/CityView";
import { CITY_BY_SLUG } from "@/lib/worldmobilize/cities";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// Admin-only concept — noindexed, not in the sitemap (matches /worldmobilize).
export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: "City | World Mobilize | GamePing AI",
    description: "Explorable settlement prototype inside the WorldMobilize fictional world.",
    path: "/worldmobilize/city",
  }),
  robots: { index: false, follow: false },
};

export default async function WorldMobilizeCityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = CITY_BY_SLUG[slug];
  if (!city) notFound();

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <AdminOnlyPageGate>
          <CityView city={city} />
        </AdminOnlyPageGate>
      </div>
    </AppPageShell>
  );
}
