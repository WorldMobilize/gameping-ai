import Link from "next/link";
import type { Metadata } from "next";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_ACCENT,
  APP_CARD_INTERACTIVE_LG,
  APP_KICKER,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
} from "@/components/app/app-styles";
import { legalPageMetadata } from "@/lib/seo/legal";

export const metadata: Metadata = legalPageMetadata(
  "/legal",
  "Legal",
  "Index of GamePing AI legal policies, disclosures, and contact information."
);

const LINKS = [
  { href: "/privacy", title: "Privacy Policy", desc: "What we collect, lawful bases, retention, and your rights." },
  { href: "/terms", title: "Terms of Service", desc: "Rules for using GamePing AI, subscriptions, and limitations." },
  { href: "/cookies", title: "Cookie Policy", desc: "Essential vs optional cookies and how to control them." },
  { href: "/disclaimer", title: "Disclaimer", desc: "AI outputs, pricing, third-party data, and external links." },
  { href: "/affiliate-disclosure", title: "Affiliate disclosure", desc: "How affiliate links work on outbound store links." },
  { href: "/refund-policy", title: "Refund policy", desc: "Subscriptions, cancellations, and how refunds are handled." },
  { href: "/contact", title: "Contact", desc: "Support, privacy requests, billing help, and bug reports." },
] as const;

export default function LegalHubPage() {
  return (
    <AppPageShell>
      <AppSection>
        <p className={APP_KICKER}>Legal</p>
        <h1 className={APP_PAGE_TITLE}>Legal &amp; compliance</h1>
        <p className={APP_PAGE_LEAD}>
          Central index for GamePing AI policies and disclosures. These documents are provided for
          transparency; they are not a substitute for professional legal advice.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {LINKS.map((item) => (
            <Link key={item.href} href={item.href} className={`group block ${APP_CARD_INTERACTIVE_LG}`}>
              <p className={`text-sm font-bold transition group-hover:text-cyan-800 dark:group-hover:text-cyan-400 ${APP_ACCENT}`}>
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.desc}</p>
            </Link>
          ))}
        </div>
      </AppSection>
    </AppPageShell>
  );
}
