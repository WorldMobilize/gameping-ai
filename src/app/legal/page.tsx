import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
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
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">Legal</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Legal &amp; compliance</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-white/60">
            Central index for GamePing AI policies and disclosures. These documents are provided for
            transparency; they are not a substitute for professional legal advice.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-cyan-400/35 hover:bg-cyan-400/[0.06]"
              >
                <p className="text-sm font-black text-cyan-300 transition group-hover:text-cyan-200">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/55">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
