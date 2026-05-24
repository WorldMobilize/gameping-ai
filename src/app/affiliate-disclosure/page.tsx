import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-last-updated";
import { legalPageMetadata } from "@/lib/seo/legal";

export const metadata: Metadata = legalPageMetadata(
  "/affiliate-disclosure",
  "Affiliate Disclosure",
  "How GamePing AI may earn from affiliate links when you purchase through deal listings."
);

export default function AffiliateDisclosurePage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">Legal</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Affiliate disclosure</h1>

          <p className="mt-4 text-sm text-white/55">Last updated: {LEGAL_LAST_UPDATED}</p>

          <div className="mt-10 space-y-8 text-white/70 leading-7">
            <p>
              GamePing AI may earn a commission when you purchase through certain outbound links to
              third-party stores. Where applicable, affiliate parameters are applied at no extra cost
              to you—the price you see on the store is set by the retailer, not by GamePing.
            </p>

            <div>
              <h2 className="text-xl font-black text-white">Independence of recommendations</h2>
              <p className="mt-3">
                AI recommendations and match scores are not “paid placements” unless we explicitly
                label otherwise in the product. Affiliate relationships do not guarantee rankings,
                match percentages, or that a specific deal will remain available or at a given price.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Accuracy &amp; store responsibility</h2>
              <p className="mt-3">
                Stores control final pricing, taxes, regional availability, and checkout. Always
                verify details on the retailer&apos;s site before you buy. GamePing surfaces
                third-party deal data as a convenience only.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Outbound tracking</h2>
              <p className="mt-3">
                When you leave GamePing through our outbound redirect, we may log a minimal click
                record (for example destination and context) to understand product usage and improve
                transparency around affiliate traffic. See the{" "}
                <Link href="/privacy" className="font-bold text-cyan-300 hover:underline">
                  Privacy Policy
                </Link>{" "}
                for how personal data is handled.
              </p>
            </div>

            <p className="text-sm text-white/50">
              <Link href="/legal" className="font-semibold text-cyan-300 hover:underline">
                ← Legal hub
              </Link>
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">
              This page is provided for general informational purposes and does not constitute legal
              advice.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
