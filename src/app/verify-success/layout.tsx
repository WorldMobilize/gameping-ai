import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildNoIndexMetadata("Email verified | GamePing AI");

export default function VerifySuccessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen flex-1">{children}</div>;
}
