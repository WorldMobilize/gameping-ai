import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#05060f]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-base font-black tracking-tight text-white">
              GamePing <span className="text-cyan-300">AI</span>
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/55">
              AI-powered game recommendations with deal-aware price lookups.
              Prices and availability may change—always confirm final pricing on the
              store before purchasing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-white/45">
                Product
              </p>
              <div className="flex flex-col gap-2 text-sm text-white/70">
                <Link href="/recommend" className="hover:text-cyan-300 transition">
                  Recommend
                </Link>
                <Link href="/dashboard" className="hover:text-cyan-300 transition">
                  Dashboard
                </Link>
                <Link href="/upgrade" className="hover:text-cyan-300 transition">
                  Premium
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-white/45">
                Company
              </p>
              <div className="flex flex-col gap-2 text-sm text-white/70">
                <Link href="/about" className="hover:text-cyan-300 transition">
                  About
                </Link>
                <Link href="/contact" className="hover:text-cyan-300 transition">
                  Contact
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-white/45">
                Legal
              </p>
              <div className="flex flex-col gap-2 text-sm text-white/70">
                <Link href="/privacy" className="hover:text-cyan-300 transition">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-cyan-300 transition">
                  Terms
                </Link>
                <Link href="/cookies" className="hover:text-cyan-300 transition">
                  Cookies
                </Link>
                <Link href="/disclaimer" className="hover:text-cyan-300 transition">
                  Disclaimer
                </Link>
                <Link
                  href="/refund-policy"
                  className="hover:text-cyan-300 transition"
                >
                  Refund policy
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} GamePing AI. All rights reserved.</p>
          <p>
            Built with third-party services (e.g., OpenAI, RAWG, CheapShark, Supabase,
            Stripe) depending on features enabled.
          </p>
        </div>
      </div>
    </footer>
  );
}

