import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_KICKER,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_PRIMARY_CTA_SM,
  APP_SECONDARY_CTA,
  homeCyanChip,
} from "@/components/app/app-styles";
import { legalPageMetadata } from "@/lib/seo/legal";

const HOW_IT_WORKS_PAGES = {
  taste: {
    title: "Tell us your taste",
    description:
      "How GamePing understands your prompts, mood, and favorite games when you describe what you want to play.",
    body: "A fuller guide to describing your taste in GamePing is on the way. For now, head to the homepage and try a search in your own words.",
  },
  matches: {
    title: "Get smarter matches",
    description:
      "How GamePing goes beyond store tags to match games on exploration, story, progression, atmosphere, and more.",
    body: "We are writing a deeper explanation of how GamePing scores fit and surfaces reasons. Check back soon, or try a recommendation from the homepage.",
  },
  discovery: {
    title: "Keep discovering",
    description:
      "Save searches, track games, and how future taste memory and Steam import will personalize discovery.",
    body: "More detail on saving, tracking, and upcoming taste features is coming soon. You can start discovering from the homepage today.",
  },
  "steam-import": {
    title: "Steam import",
    description:
      "How connecting your Steam library will help GamePing skip games you own and learn from your play history.",
    body: "Steam import is not live yet. We are building a way to connect your library so recommendations get smarter over time. Check back soon.",
    kicker: "Coming soon",
  },
  "taste-memory": {
    title: "Taste memory",
    description:
      "How GamePing will remember your searches, saved games, and play patterns to refine future picks.",
    body: "Taste memory is on the roadmap. Soon GamePing will learn from your activity to personalize results. For now, try a search from the homepage.",
    kicker: "Coming soon",
  },
} as const;

type HowItWorksSlug = keyof typeof HOW_IT_WORKS_PAGES;

export function generateStaticParams() {
  return Object.keys(HOW_IT_WORKS_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = HOW_IT_WORKS_PAGES[slug as HowItWorksSlug];
  if (!page) return {};

  return legalPageMetadata(`/how-it-works/${slug}`, page.title, page.description);
}

export default async function HowItWorksDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = HOW_IT_WORKS_PAGES[slug as HowItWorksSlug];
  if (!page) notFound();

  const soonChip = homeCyanChip(false);

  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-2xl">
        {"kicker" in page && page.kicker ? (
          <span className={`inline-flex ${soonChip}`}>{page.kicker}</span>
        ) : (
          <p className={APP_KICKER}>How GamePing works</p>
        )}
        <h1 className={APP_PAGE_TITLE}>{page.title}</h1>
        <p className={APP_PAGE_LEAD}>{page.body}</p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/" className={APP_PRIMARY_CTA_SM}>
            Back to homepage
          </Link>
          <Link href="/recommend" className={APP_SECONDARY_CTA}>
            Try GamePing
          </Link>
        </div>
      </AppSection>
    </AppPageShell>
  );
}
