import { notFound } from "next/navigation";
import AppPageShell from "@/components/app/AppPageShell";
import WorldMobilizeComingSoon from "@/components/worldmobilize/WorldMobilizeComingSoon";
import { CITY_BY_SLUG } from "@/lib/worldmobilize/cities";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

// Locked pre-launch: renders a Coming Soon placeholder (not the city prototype)
// and stays noindex. Unknown slugs still 404. The real view (CityView) still
// exists and is re-enabled at launch.
export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: "World Mobilize | GamePing AI",
    description: "World Mobilize is coming soon to GamePing.",
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
  if (!CITY_BY_SLUG[slug]) notFound();

  return (
    <AppPageShell hideAmbient>
      <div className="gp-accent-page relative isolate min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="gp-landing-bg" />
        <WorldMobilizeComingSoon />
      </div>
    </AppPageShell>
  );
}
