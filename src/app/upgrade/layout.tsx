import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildNoIndexMetadata("Upgrade | GamePing AI");

export default function UpgradeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
