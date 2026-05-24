import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import AppProviders from "@/components/AppProviders";
import ConditionalFooter from "@/components/ConditionalFooter";
import { Analytics } from "@vercel/analytics/next";
import { getMetadataBase, SITE_NAME } from "@/lib/seo/site";
import { steamHeaderImage } from "@/lib/curated/game-links";

const defaultOgImage = steamHeaderImage(1145360);

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "GamePing AI — AI game discovery with real prices",
    template: "%s",
  },
  description:
    "Describe your taste and get AI-powered game picks with match scores, verified deals, and price tracking on GamePing AI.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    images: [{ url: defaultOgImage, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    images: [defaultOgImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders>{children}</AppProviders>
        <ConditionalFooter />
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}