import { buildNoIndexMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

export const metadata: Metadata = buildNoIndexMetadata(
  "Your weekly picks | GamePing AI"
);

export default function WeeklyPicksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
