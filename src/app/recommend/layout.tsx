import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "AI Game Recommendations | GamePing AI",
  description:
    "Describe your mood, budget, and platform to get five tailored game picks with match scores, reasons, and real prices on GamePing AI.",
  path: "/recommend",
});

export default function RecommendLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
