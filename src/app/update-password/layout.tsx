import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildNoIndexMetadata("Update password | GamePing AI");

export default function UpdatePasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
