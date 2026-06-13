import PingOrb from "@/components/home/PingOrb";
import { HOME_HERO_INSIGHT } from "@/components/home/home-demo-data";

export default function HomePingPanel() {
  return (
    <div className="gp-home-ping-panel w-full min-w-0">
      <div className="gp-home-glass relative overflow-hidden rounded-[1.75rem] border border-white/10 p-6 shadow-[0_30px_80px_-32px_rgba(0,0,0,0.8)] min-[960px]:p-7">
        <span className="gp-home-panel-blob" aria-hidden />

        <div className="relative flex flex-col items-center text-center">
          <PingOrb size={148} />
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
            Meet Ping
          </p>
          <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-white/80">
            &ldquo;I don&apos;t just look at tags. I learn{" "}
            <span className="font-medium text-white">why you play</span>.&rdquo;
          </p>
        </div>

        <div className="relative mt-6 space-y-3">
          <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/75">
            &ldquo;{HOME_HERO_INSIGHT.input}&rdquo;
          </div>

          <div className="rounded-2xl rounded-bl-md border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
              Ping understands
            </p>
            <ul className="mt-2 space-y-1.5">
              {HOME_HERO_INSIGHT.understands.map((item) => (
                <li key={item.label} className="flex gap-2 text-sm">
                  <span className="shrink-0 font-medium text-white/45">{item.label}:</span>
                  <span className="text-white/80">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="relative mt-4 flex flex-wrap gap-2">
          {HOME_HERO_INSIGHT.outputs.map((item, i) => {
            const dot = ["bg-cyan-300", "bg-violet-300", "bg-rose-300", "bg-amber-300"][i % 4];
            return (
              <li
                key={item}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/65"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
                {item}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
