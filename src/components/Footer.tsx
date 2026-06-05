import Link from "next/link";
import FeedbackButton from "@/components/FeedbackButton";
import SocialPlatformIcon from "@/components/SocialPlatformIcon";
import { EARLY_ACCESS_NOTICE } from "@/lib/product-copy";
import { SITE_SOCIAL_LINKS } from "@/lib/site-social-links";

const socialLinkClass =
  "inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition-colors duration-200 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60";

export default function Footer() {
  return (
    <footer className="mt-auto overflow-x-hidden border-t border-white/10 bg-[#070817]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-base font-black tracking-tight text-slate-100">
              GamePing <span className="text-cyan-300">AI</span>
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
              AI-powered game recommendations with deal-aware price lookups.
              Prices and availability may change—always confirm final pricing on the
              store before purchasing.
            </p>
            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-300/70">
                Follow us
              </p>
              <ul className="mt-3 flex max-w-md flex-wrap items-center gap-6">
                {SITE_SOCIAL_LINKS.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.ariaLabel}
                      className={socialLinkClass}
                    >
                      <SocialPlatformIcon
                        platform={item.label}
                        className="h-[26px] w-[26px]"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-10">
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-300/70">
                Product
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <Link
                  href="/recommend"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Recommend
                </Link>
                <Link
                  href="/dashboard"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Dashboard
                </Link>
                <Link
                  href="/upgrade"
                  className="transition hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
                >
                  Premium
                </Link>
                <Link
                  href="/curated"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Curated lists
                </Link>
                <Link
                  href="/games"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Games A–Z
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-300/70">
                Company
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <Link
                  href="/about"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Contact
                </Link>
                <FeedbackButton />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-300/70">
                Legal
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <Link
                  href="/legal"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Legal hub
                </Link>
                <Link
                  href="/privacy"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Terms
                </Link>
                <Link
                  href="/cookies"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Cookies
                </Link>
                <Link
                  href="/disclaimer"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Disclaimer
                </Link>
                <Link
                  href="/affiliate-disclosure"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Affiliate disclosure
                </Link>
                <Link
                  href="/refund-policy"
                  className="transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  Refund policy
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
            {EARLY_ACCESS_NOTICE}
          </p>

          <div className="mt-6 flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-start sm:justify-between">
            <p className="whitespace-nowrap">
              © {new Date().getFullYear()} GamePing AI. All rights reserved.
            </p>
            <p className="max-w-3xl">
              Built with third-party services (e.g., OpenAI, RAWG, CheapShark, Supabase,
              Stripe) depending on features enabled.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

