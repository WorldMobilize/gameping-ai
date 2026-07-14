import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

/**
 * Typography. Inter carries body/UI (clean, legible, premium workhorse);
 * Manrope carries display headings (elegant, a touch more expensive on large
 * type) — a calm modern-SaaS pairing, no arcade/sci-fi. Exposed as CSS vars so
 * globals.css (--font-sans) and .gp-home-display can consume them.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});
import CookieBanner from "@/components/CookieBanner";
import AppProviders from "@/components/AppProviders";
import ConditionalFloatingFeedback from "@/components/ConditionalFloatingFeedback";
import ConditionalFooter from "@/components/ConditionalFooter";
import { FeedbackProvider } from "@/components/FeedbackProvider";
import { HOME_THEME_INIT_SCRIPT } from "@/components/home/home-theme";
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
    <html lang="en" className={`h-full antialiased ${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        {/* Raw tag, not next/script: the theme must be applied before the first
            paint, and an inline beforeInteractive script is not executed on
            client navigations. */}
        <script dangerouslySetInnerHTML={{ __html: HOME_THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <FeedbackProvider>
          <AppProviders>
            {children}
            <ConditionalFooter />
            <ConditionalFloatingFeedback />
          </AppProviders>
        </FeedbackProvider>
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
