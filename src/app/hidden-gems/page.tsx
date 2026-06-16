import Link from "next/link";
import AppPageShell, { AppSection } from "@/components/app/AppPageShell";
import {
  APP_INLINE_LINK,
  APP_KICKER,
  APP_PAGE_LEAD,
  APP_PAGE_TITLE,
  APP_PRIMARY_CTA_SM,
  homeCyanAccentText,
} from "@/components/app/app-styles";
import DiscoveryComingSoonBadge from "@/components/discovery/DiscoveryComingSoonBadge";
import DiscoveryFutureCard from "@/components/discovery/DiscoveryFutureCard";
import HiddenGemCard from "@/components/discovery/HiddenGemCard";
import { HIDDEN_GEMS_DEMO } from "@/lib/discovery/placeholder-data";
import { buildPublicPageMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Hidden gems | GamePing AI",
  description:
    "Discover overlooked, unusual, and underrated games worth your time — a preview of GamePing's future hidden-gems discovery.",
  path: "/hidden-gems",
});

export default function HiddenGemsPage() {
  const accent = homeCyanAccentText(false);

  return (
    <AppPageShell>
      <AppSection maxWidth="max-w-6xl">
        <div className="flex flex-wrap items-center gap-3">
          <p className={APP_KICKER}>Discovery</p>
          <DiscoveryComingSoonBadge />
        </div>

        <h1 className={APP_PAGE_TITLE}>
          Hidden <span className={accent}>gems</span>
        </h1>

        <p className={APP_PAGE_LEAD}>
          Discover games you might never search for — overlooked, unusual, and underrated picks
          worth your time.
        </p>

        <section className="mt-12" aria-labelledby="hidden-gems-grid-heading">
          <h2 id="hidden-gems-grid-heading" className="text-2xl font-extrabold text-slate-900">
            Featured hidden gems
          </h2>
          <p className="mt-2 text-sm text-slate-500">Static demo grid — not live discovery yet.</p>

          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HIDDEN_GEMS_DEMO.map((pick) => (
              <li key={pick.title} className="flex">
                <HiddenGemCard pick={pick} />
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12">
          <DiscoveryFutureCard
            title="How this will work"
            bullets={[
              "Game database signals",
              "Deal awareness",
              "AI taste matching",
            ]}
          />
        </div>

        <div className="mt-10 rounded-3xl border border-cyan-200/80 bg-cyan-50/60 p-6">
          <p className="text-sm font-bold text-slate-800">
            Want personalized picks today?
          </p>
          <Link href="/recommend" className={`mt-3 inline-flex ${APP_PRIMARY_CTA_SM}`}>
            Run AI recommendations
          </Link>
          {" · "}
          <Link href="/games-of-the-week" className={APP_INLINE_LINK}>
            Games of the week
          </Link>
        </div>
      </AppSection>
    </AppPageShell>
  );
}
