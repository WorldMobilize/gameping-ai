import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import AppProviders from "@/components/AppProviders";
import ConditionalFooter from "@/components/ConditionalFooter";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "GamePing AI",
  description: "AI-powered game recommendations with real prices and deal alerts.",
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