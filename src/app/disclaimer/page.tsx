import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-last-updated";
import { legalPageMetadata } from "@/lib/seo/legal";

export const metadata: Metadata = legalPageMetadata(
  "/disclaimer",
  "Disclaimer",
  "Disclaimers for AI recommendations, pricing data, third-party sources, and external links."
);

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">Legal</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Disclaimer</h1>

          <p className="mt-4 text-sm text-white/55">Last updated: {LEGAL_LAST_UPDATED}</p>

          <div className="mt-10 space-y-8 text-white/70 leading-7">
            <p>
              GamePing AI provides AI-powered video game recommendations and deal-aware price
              lookups. The Service is provided for general informational purposes only.
            </p>

            <div>
              <h2 className="text-xl font-black text-white">AI recommendations</h2>
              <p className="mt-3">
                Recommendations are generated automatically. They may be inaccurate, incomplete, or
                not match your preferences, playstyle, region, platform availability, or other
                constraints. We do not guarantee perfect recommendations.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Third-party game data</h2>
              <p className="mt-3">
                Game metadata may come from third-party sources. We do not control third-party data
                quality and cannot guarantee it is always correct or up to date.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Prices, deals, and availability</h2>
              <p className="mt-3">
                Prices and deals may be inaccurate, delayed, unavailable, or changed by stores at
                any time. Always verify final price and availability on the store before purchasing.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">No affiliation</h2>
              <p className="mt-3">
                GamePing AI is not affiliated with or endorsed by game publishers, platforms, or
                stores unless explicitly stated.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">External links</h2>
              <p className="mt-3">
                The Service may contain links to third-party websites. These external sites are not
                under our control. We are not responsible for their content, policies, pricing, or
                purchase processes.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Affiliate disclosure</h2>
              <p className="mt-3">
                Some outbound links may be affiliate links. This means GamePing AI may earn revenue
                at no additional cost to you. A fuller explanation of independence, rankings, and
                click logging is in our{" "}
                <Link href="/affiliate-disclosure" className="font-bold text-cyan-300 hover:underline">
                  Affiliate disclosure
                </Link>
                .
              </p>
            </div>

            <p className="text-sm text-white/50">
              <Link href="/legal" className="font-semibold text-cyan-300 hover:underline">
                Legal hub
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
