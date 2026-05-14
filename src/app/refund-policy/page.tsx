import Link from "next/link";
import Navbar from "@/components/Navbar";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-last-updated";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#05060f] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">Legal</p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">Refund Policy</h1>

          <p className="mt-4 text-sm text-white/55">Last updated: {LEGAL_LAST_UPDATED}</p>

          <div className="mt-10 space-y-8 text-white/70 leading-7">
            <p>
              This Refund Policy describes how refunds are handled for paid subscriptions to GamePing
              AI.
            </p>

            <div>
              <h2 className="text-xl font-black text-white">Subscriptions</h2>
              <p className="mt-3">
                Premium is offered as a monthly subscription (where available). You can cancel your
                subscription at any time. Cancellation stops future renewals; access may continue
                until the end of the current billing period depending on how the subscription is
                configured.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Refunds</h2>
              <p className="mt-3">
                Refunds are handled on a case-by-case basis unless required by applicable law. If
                you believe you were charged incorrectly or experienced a billing issue, contact
                support with your account email and relevant details.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Payment processing</h2>
              <p className="mt-3">
                Payments are processed by Stripe. We do not store your full card details. Any refunds
                (if approved) are issued through Stripe to the original payment method where
                possible.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Contact</h2>
              <p className="mt-3">
                Email{" "}
                <span className="font-bold text-white">support@gamepingai.com</span> for billing or
                refund questions.
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
