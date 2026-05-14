import Link from "next/link";
import Navbar from "@/components/Navbar";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-last-updated";

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">Legal</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Cookie Policy</h1>

          <p className="mt-4 text-sm text-white/55">Last updated: {LEGAL_LAST_UPDATED}</p>

          <div className="mt-10 space-y-8 text-white/70 leading-7">
            <p>
              This Cookie Policy explains how GamePing AI uses cookies and similar technologies
              (including closely related local storage keys where noted).
            </p>

            <div>
              <h2 className="text-xl font-black text-white">Essential cookies (required)</h2>
              <p className="mt-3">
                Essential cookies are needed for core functionality, including authentication,
                session continuity, CSRF protections where applicable, and security. Without them,
                sign-in, your dashboard, and saved searches will not work reliably.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Optional cookies &amp; analytics</h2>
              <p className="mt-3">
                As of the last updated date above, the GamePing codebase does not load third-party
                marketing analytics SDKs (for example Google Analytics) based on our current
                implementation. If we add optional analytics in the future, we will update this policy
                and, where required, align consent mechanics with the feature.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Cookie banner &amp; localStorage</h2>
              <p className="mt-3">
                Our cookie banner stores your choice in browser{" "}
                <span className="font-mono text-white/80">localStorage</span> under the key{" "}
                <span className="font-mono text-white/80">cookie_consent</span> (values such as
                &quot;accepted&quot; or &quot;rejected&quot;). This is not a tracking cookie, but it
                is a client-side record of your preference. You can clear it anytime via browser
                settings.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Third-party cookies</h2>
              <p className="mt-3">
                When you authenticate, pay, or interact with embedded flows, third parties such as
                Supabase (auth/session), Stripe (checkout), or email providers may set or read their
                own cookies strictly as needed to deliver those services. We do not control their
                cookie names or lifetimes; refer to their policies for detail.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">How to control cookies</h2>
              <p className="mt-3">
                You can block or delete cookies via browser settings. Blocking essential cookies may
                prevent login and other features from working. You can also use private/incognito
                modes for ephemeral sessions (with reduced convenience).
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
