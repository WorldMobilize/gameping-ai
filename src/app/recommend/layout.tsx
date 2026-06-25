import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "AI Game Recommendations | GamePing AI",
  description:
    "Get AI game recommendations with match scores, explanations, and price information available on game pages.",
  path: "/recommend",
});

export default function RecommendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
