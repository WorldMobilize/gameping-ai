import { buildNoIndexMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

export const metadata: Metadata = buildNoIndexMetadata(
  "Monthly recap | GamePing AI"
);

export default function MonthlyRecapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
