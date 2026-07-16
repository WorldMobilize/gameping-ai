import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo/site";

// Public pricing/marketing page (Free vs Premium) — no personalized data, so it
// is indexable. Personalized premium pages (weekly-picks, deals-for-you,
// monthly-recap) stay noindex.
export const metadata: Metadata = buildPublicPageMetadata({
  title: "GamePing Premium — pricing & plans | GamePing AI",
  description:
    "Compare GamePing Free and Premium. Premium adds Steam library sync, your Taste DNA taste profile, Weekly Picks, personalized Deals For You, and a Monthly Recap.",
  path: "/upgrade",
});

export default function UpgradeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
