import { buildNoIndexMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

export const metadata: Metadata = buildNoIndexMetadata(
  "Deals for you | GamePing AI"
);

export default function DealsForYouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
