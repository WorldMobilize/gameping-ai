import { notFound } from "next/navigation";
import type { Metadata } from "next";
import HowItWorksDetailView from "@/components/how-it-works/HowItWorksDetailView";
import { legalPageMetadata } from "@/lib/seo/legal";
import {
  getHowItWorksPage,
  getHowItWorksSlugs,
} from "@/lib/how-it-works/pages";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";

export function generateStaticParams() {
  return getHowItWorksSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getHowItWorksPage(slug);
  if (!page) return {};

  return legalPageMetadata(`/how-it-works/${slug}`, page.title, page.description);
}

export default async function HowItWorksDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getHowItWorksPage(slug);
  if (!page) notFound();

  const breadcrumbs: GameBreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/how-it-works" },
    { label: page.navLabel },
  ];

  return (
    <HowItWorksDetailView
      slug={slug}
      breadcrumbs={breadcrumbs}
      page={{
        title: page.title,
        description: page.description,
        body: page.body,
        kicker: page.kicker,
      }}
    />
  );
}
