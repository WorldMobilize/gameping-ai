import { notFound } from "next/navigation";
import type { Metadata } from "next";
import HowItWorksDetailView from "@/components/how-it-works/HowItWorksDetailView";
import { legalPageMetadata } from "@/lib/seo/legal";

const HOW_IT_WORKS_PAGES = {
  taste: {
    title: "Tell us your taste",
    description:
      "GamePing doesn't need perfect filters. Describe what you feel like playing in your own words, and it reads the mood, pacing, and games behind your prompt.",
    body: "A fuller guide to describing your taste in GamePing is on the way. For now, head to the homepage and try a search in your own words.",
  },
  matches: {
    title: "Get smarter matches",
    description:
      "GamePing goes beyond store tags to analyze why a game fits — gameplay loop, freedom, difficulty, story focus, atmosphere, progression, and replayability.",
    body: "We are writing a deeper explanation of how GamePing scores fit and surfaces reasons. Check back soon, or try a recommendation from the homepage.",
  },
  discovery: {
    title: "Keep discovering",
    description:
      "Discovery continues after one search. Save recommendation runs, track games, and get price alerts today — with stronger taste memory and Steam import on the way.",
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

  return (
    <HowItWorksDetailView
      slug={slug}
      page={{
        title: page.title,
        description: page.description,
        body: page.body,
        kicker: "kicker" in page ? page.kicker : undefined,
      }}
    />
  );
}
