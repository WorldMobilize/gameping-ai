import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import AppProviders from "@/components/AppProviders";
import ConditionalFloatingFeedback from "@/components/ConditionalFloatingFeedback";
import ConditionalFooter from "@/components/ConditionalFooter";
import { FeedbackProvider } from "@/components/FeedbackProvider";
import { Analytics } from "@vercel/analytics/next";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  DEFAULT_SOCIAL_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  getMetadataBase,
  SITE_NAME,
} from "@/lib/seo/site";

const defaultOgImageMeta = {
  url: DEFAULT_OG_IMAGE,
  width: 1200,
  height: 630,
  alt: SITE_NAME,
} as const;

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: DEFAULT_SITE_TITLE,
    template: "%s",
  },
  description: DEFAULT_SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SOCIAL_DESCRIPTION,
    images: [defaultOgImageMeta],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SOCIAL_DESCRIPTION,
    images: [defaultOgImageMeta],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#05060f] font-sans text-white">
        <FeedbackProvider>
          <AppProviders>{children}</AppProviders>
          <ConditionalFooter />
          <ConditionalFloatingFeedback />
        </FeedbackProvider>
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
