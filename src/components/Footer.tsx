import Link from "next/link";
import FeedbackButton from "@/components/FeedbackButton";
import SocialPlatformIcon from "@/components/SocialPlatformIcon";
import { EARLY_ACCESS_NOTICE } from "@/lib/product-copy";
import { SITE_SOCIAL_LINKS } from "@/lib/site-social-links";

type FooterProps = {
  theme?: "dark" | "light";
  /** "themed" = a cinematic page (fixed bg) → translucent glass footer; else solid. */
  accent?: "default" | "themed";
};

export default function Footer({ theme = "dark", accent = "default" }: FooterProps) {
  const isLight = theme === "light";
  // Cinematic pages have a fixed background image → translucent glass footer so
  // it blends in (no hard cutoff). Default pages keep a solid footer. The accent
  // COLOUR always follows the current page via --page-accent-* below.
  const isCinematic = accent === "themed";

  // Accent COLOUR follows the current page via --page-accent-* (set per route),
  // so footer headings/links/AI mark match whatever page you're on (cyan / gold
  // / green / violet / sky) in both themes.
  const hoverText = "hover:text-[color:var(--page-accent-text)]";
  const focusRing = "focus-visible:ring-[color:var(--page-accent-border)]";
  const baseTextColor = isLight ? "text-slate-600" : "text-slate-400";

  const socialLinkClass = `inline-flex items-center justify-center rounded-lg p-1.5 ${baseTextColor} transition-colors duration-200 ${hoverText} focus-visible:outline-none focus-visible:ring-2 ${focusRing}`;
  const linkClass = `transition ${hoverText} focus-visible:outline-none focus-visible:ring-2 ${focusRing}`;
  const headingColor = "text-[color:var(--page-accent-text)]";
  const aiAccent = "text-[color:var(--page-accent-text)]";

  // The light frosted surface uses --page-surface so it picks up the page's
  // accent tint automatically (champagne / green / violet / sky).
  const borderColor = "border-[color:var(--page-accent-border)]";
  const footerBg = isCinematic
    ? isLight
      ? "bg-[var(--page-surface)] backdrop-blur-md"
      : "bg-[#080b14]/80 backdrop-blur-md"
    : isLight
      ? "bg-[#F6F8FC]"
      : "bg-[#080b14]/85 backdrop-blur-md";

  return (
    <footer className={`relative z-10 mt-auto w-full border-t ${borderColor} ${footerBg}`}>
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p
              className={`text-base font-black tracking-tight ${
                isLight ? "text-slate-900" : "text-slate-100"
              }`}
            >
              GamePing <span className={aiAccent}>AI</span>
            </p>
            <p
              className={`mt-3 max-w-md text-sm leading-6 ${
                isLight ? "text-slate-600" : "text-slate-400"
              }`}
            >
              The home for gamers—AI discovery that learns your taste, curated picks, and
              deal-aware price tracking in one place. Prices and availability may change—always
              confirm on the store before purchasing.
            </p>
            <div className="mt-5">
              <p
                className={`text-xs font-black uppercase tracking-[0.35em] ${headingColor}`}
              >
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
                      <SocialPlatformIcon platform={item.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-10">
            <div className="space-y-3">
              <p
                className={`text-xs font-black uppercase tracking-[0.35em] ${headingColor}`}
              >
                Product
              </p>
              <div
                className={`flex flex-col gap-2 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}
              >
                <Link href="/recommend" className={linkClass}>
                  Recommend
                </Link>
                <Link href="/how-it-works" className={linkClass}>
                  Features
                </Link>
                <Link href="/curated" className={linkClass}>
                  Curated lists
                </Link>
                <Link href="/games" className={linkClass}>
                  Games A–Z
                </Link>
                <Link href="/hidden-gems" className={linkClass}>
                  Hidden gems
                </Link>
                <Link href="/games-of-the-week" className={linkClass}>
                  Games of the week
                </Link>
                <Link href="/upgrade" className={linkClass}>
                  Premium
                </Link>
                <Link href="/dashboard" className={linkClass}>
                  Dashboard
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <p
                className={`text-xs font-black uppercase tracking-[0.35em] ${headingColor}`}
              >
                Company
              </p>
              <div
                className={`flex flex-col gap-2 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}
              >
                <Link href="/about" className={linkClass}>
                  About
                </Link>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
                <FeedbackButton
                  className={`text-left text-sm ${isLight ? "text-slate-600" : "text-slate-400"} ${linkClass}`}
                />
              </div>
            </div>

            <div className="space-y-3">
              <p
                className={`text-xs font-black uppercase tracking-[0.35em] ${headingColor}`}
              >
                Legal
              </p>
              <div
                className={`flex flex-col gap-2 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}
              >
                <Link href="/legal" className={linkClass}>
                  Legal hub
                </Link>
                <Link href="/privacy" className={linkClass}>
                  Privacy
                </Link>
                <Link href="/terms" className={linkClass}>
                  Terms
                </Link>
                <Link href="/cookies" className={linkClass}>
                  Cookies
                </Link>
                <Link href="/disclaimer" className={linkClass}>
                  Disclaimer
                </Link>
                <Link href="/affiliate-disclosure" className={linkClass}>
                  Affiliate disclosure
                </Link>
                <Link href="/refund-policy" className={linkClass}>
                  Refund policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`w-full border-t ${borderColor}`} aria-hidden />

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <p
            className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}
          >
            {EARLY_ACCESS_NOTICE}
          </p>
          <p className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            © {new Date().getFullYear()} GamePing AI. All rights reserved.
          </p>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Built with third-party services including OpenAI, RAWG, CheapShark, Supabase and
            Stripe.
          </p>
        </div>
      </div>
    </footer>
  );
}
