import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">Support</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Contact</h1>

          <p className="mt-6 text-white/65 leading-7">
            Choose the inbox that best matches your request so we can route it quickly. Include your
            account email (if applicable), browser, and steps to reproduce for bugs.
          </p>

          <div className="mt-10 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200">
                General support &amp; bugs
              </p>
              <p className="mt-2 break-all text-lg font-black text-cyan-300">support@gamepingai.com</p>
              <p className="mt-2 text-sm text-white/55">
                Product questions, troubleshooting, saved searches, recommendations, and technical bug
                reports.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-200">
                Privacy &amp; data rights
              </p>
              <p className="mt-2 break-all text-lg font-black text-purple-300">privacy@gamepingai.com</p>
              <p className="mt-2 text-sm text-white/55">
                Access, correction, deletion assistance, portability questions, and GDPR/UK GDPR
                requests. For fastest account removal, use{" "}
                <Link href="/settings/account" className="font-semibold text-cyan-300 hover:underline">
                  Settings → Account
                </Link>{" "}
                (self-serve deletion).
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-white/50">
                Legal &amp; compliance notices
              </p>
              <p className="mt-2 break-all text-lg font-black text-white/90">legal@gamepingai.com</p>
              <p className="mt-2 text-sm text-white/55">
                Formal legal notices and compliance correspondence (not for routine support).
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200">
                Billing &amp; refunds
              </p>
              <p className="mt-2 text-sm text-white/65">
                Start with{" "}
                <span className="font-bold text-white">support@gamepingai.com</span> and include your
                billing email and approximate charge date. Premium is billed through Stripe; many
                billing actions are also available from Stripe&apos;s customer emails after purchase.
                See the{" "}
                <Link href="/refund-policy" className="font-bold text-cyan-200 hover:underline">
                  Refund policy
                </Link>
                .
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-white/50">
                Account deletion
              </p>
              <p className="mt-2 text-sm text-white/65">
                Use in-product deletion at{" "}
                <Link href="/settings/account" className="font-bold text-cyan-300 hover:underline">
                  /settings/account
                </Link>{" "}
                for a self-serve, authenticated workflow. If you are locked out, email{" "}
                <span className="font-bold text-white">privacy@gamepingai.com</span> from the address
                associated with your account.
              </p>
            </div>
          </div>

          <p className="mt-8 text-sm text-white/50">
            We aim to respond within a reasonable timeframe. During early access, response times may
            vary.
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">
            This page is provided for general informational purposes and does not constitute legal
            advice.
          </div>

          <p className="mt-6 text-sm text-white/45">
            <Link href="/legal" className="font-semibold text-cyan-300 hover:underline">
              Legal hub
            </Link>
          </p>

          <div className="mt-14 rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-400/10 to-purple-500/10 p-8 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">Next step</p>
              <p className="mt-2 text-xl font-black md:text-2xl">Ready to discover your next game?</p>
            </div>
            <Link
              href="/recommend"
              className="mt-6 inline-flex rounded-full bg-cyan-400 px-8 py-3.5 text-sm font-black text-black shadow-[0_0_28px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300 md:mt-0"
            >
              Open GamePing AI
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
