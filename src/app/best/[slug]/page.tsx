import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppPageShell from "@/components/app/AppPageShell";
import HubPageView from "@/components/seo/HubPageView";
import { getHub, hubHref, hubsByKind } from "@/lib/seo/discovery-hubs";
import { buildPublicPageMetadata } from "@/lib/seo/site";

export function generateStaticParams() {
  return hubsByKind("best").map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hub = getHub("best", slug);
  if (!hub) return {};
  return buildPublicPageMetadata({
    title: hub.metaTitle,
    description: hub.metaDescription,
    path: hubHref(hub),
  });
}

export default async function BestHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hub = getHub("best", slug);
  if (!hub) notFound();

  return (
    <AppPageShell hideAmbient>
      <HubPageView hub={hub} />
    </AppPageShell>
  );
}
