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
      "Discovery continues after one search. Save recommendation runs, track games, get price alerts, and sync your Steam library so your GamePing DNA makes results more personal.",
    body: "Save searches, track games, and connect Steam from your account settings — your GamePing DNA builds from those signals. Start discovering from the homepage today.",
  },
  "steam-import": {
    title: "Steam Library Sync",
    description:
      "Connect your Steam library so GamePing understands what you actually play — not just what you search.",
    body: "Steam Library Sync is live. Connect your library from your account settings and GamePing learns from your owned games and playtime — skipping games you already own and powering your Weekly Picks, Deals For You, and Monthly Recap.",
    kicker: "Premium",
  },
  "taste-memory": {
    title: "GamePing DNA",
    description:
      "Your personal gaming profile evolves from your library, searches, and saved games.",
    body: "GamePing DNA is live. It builds from your Steam library, searches, saved games, and tracked games to personalize your Weekly Picks, Deals For You, and Monthly Recap. The more you use GamePing, the sharper it gets.",
    kicker: "Premium",
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
