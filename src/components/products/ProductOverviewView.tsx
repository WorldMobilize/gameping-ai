import Link from "next/link";
import { NAVY_CTA, NAVY_CTA_LG, NAVY_OUTLINE } from "@/components/app/app-styles";
import type { ProductOverview } from "@/lib/product-overviews";

/**
 * Shared product overview page (Read More / SEO hub). Hero → overview → core
 * features → roadmap → FAQ → CTA. Neutral navy/gray language matching the
 * landing. Server component, indexable.
 */

const HEADING = "text-slate-900 dark:text-white";
const BODY = "text-slate-600 dark:text-slate-400";
const CARD = "border-slate-200/80 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.02]";

export default function ProductOverviewView({ product }: { product: ProductOverview }) {
  return (
    <div className="relative z-10">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
        <p className={`text-[13px] font-semibold uppercase tracking-[0.18em] ${BODY}`}>{product.status}</p>
        <h1 className={`gp-home-display mt-4 text-balance text-5xl font-semibold tracking-tight sm:text-7xl ${HEADING}`}>{product.name}</h1>
        <p className={`mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl ${BODY}`}>{product.tagline}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={product.primary.href} className={NAVY_CTA_LG}>{product.primary.label}</Link>
          <Link href="/recommend" className={NAVY_OUTLINE}>Try GamePing</Link>
        </div>
      </section>

      {/* Overview */}
      <section className="border-t border-slate-200/60 bg-slate-50/60 py-20 dark:border-white/[0.06] dark:bg-white/[0.015] sm:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className={`gp-home-display text-3xl font-semibold tracking-tight sm:text-4xl ${HEADING}`}>{product.overviewTitle}</h2>
          <p className={`mt-6 text-lg leading-relaxed ${BODY}`}>{product.overview}</p>
        </div>
      </section>

      {/* Core features */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className={`gp-home-display text-3xl font-semibold tracking-tight sm:text-4xl ${HEADING}`}>Core features</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.features.map((f) => (
              <div key={f.title} className={`rounded-2xl border p-6 ${CARD}`}>
                <p className={`text-base font-semibold ${HEADING}`}>{f.title}</p>
                <p className={`mt-2 text-sm leading-6 ${BODY}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="border-t border-slate-200/60 bg-slate-50/60 py-20 dark:border-white/[0.06] dark:bg-white/[0.015] sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className={`gp-home-display text-3xl font-semibold tracking-tight sm:text-4xl ${HEADING}`}>Roadmap</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {product.roadmap.map((r, i) => (
              <div key={r.phase} className={`rounded-2xl border p-6 ${CARD}`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${i === 0 ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>{i + 1}</span>
                  <p className={`text-sm font-semibold uppercase tracking-[0.14em] ${HEADING}`}>{r.phase}</p>
                </div>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {r.items.map((it) => (
                    <li key={it} className={`flex items-start gap-2.5 text-sm ${BODY}`}>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className={`gp-home-display text-3xl font-semibold tracking-tight sm:text-4xl ${HEADING}`}>FAQ</h2>
          <div className="mt-8 flex flex-col gap-3">
            {product.faqs.map((item) => (
              <details key={item.q} className={`group rounded-2xl border px-5 py-4 ${CARD}`}>
                <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold ${HEADING}`}>
                  {item.q}
                  <svg className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
                </summary>
                <p className={`mt-3 text-sm leading-6 ${BODY}`}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200/60 px-6 py-24 text-center dark:border-white/[0.06] sm:py-32">
        <h2 className={`gp-home-display mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl ${HEADING}`}>Be part of it early</h2>
        <p className={`mx-auto mt-5 max-w-lg text-lg leading-relaxed ${BODY}`}>GamePing is one ecosystem — start with Discovery and grow into the rest.</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={product.primary.href} className={NAVY_CTA}>{product.primary.label}</Link>
          <Link href="/signup" className={NAVY_OUTLINE}>Create free account</Link>
        </div>
      </section>
    </div>
  );
}
