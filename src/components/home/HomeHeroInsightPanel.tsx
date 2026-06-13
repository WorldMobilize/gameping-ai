import { HOME_HERO_INSIGHT } from "@/components/home/home-demo-data";

export default function HomeHeroInsightPanel() {
  return (
    <div className="gp-home-insight w-full min-w-0">
      <div className="gp-home-insight-card overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0d14]/85 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.65)] backdrop-blur-sm transition-transform duration-500 hover:-translate-y-0.5">
        <div className="border-b border-white/[0.06] bg-black/25 px-4 py-3 backdrop-blur-sm min-[960px]:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-400/15 ring-1 ring-sky-400/25">
              <span className="text-[9px] font-bold text-sky-300">GP</span>
            </span>
            <p className="text-xs font-semibold text-white/75">How GamePing reads a search</p>
          </div>
        </div>

        <div className="space-y-4 p-4 min-[960px]:p-5">
          <p className="text-sm font-medium leading-snug text-white/85">
            {HOME_HERO_INSIGHT.title}
          </p>

          <div className="rounded-xl border border-white/[0.07] bg-black/30 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Input
            </p>
            <p className="mt-1.5 text-sm italic text-white/70">
              &ldquo;{HOME_HERO_INSIGHT.input}&rdquo;
            </p>
          </div>

          <div className="rounded-xl border border-sky-400/15 bg-sky-400/[0.04] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/70">
              GamePing understands
            </p>
            <ul className="mt-2.5 space-y-2">
              {HOME_HERO_INSIGHT.understands.map((item) => (
                <li key={item.label} className="flex gap-2 text-sm">
                  <span className="shrink-0 font-medium text-white/45">{item.label}:</span>
                  <span className="text-white/75">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Output
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {HOME_HERO_INSIGHT.outputs.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-sky-400/80" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
