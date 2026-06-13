import PingOrb from "@/components/home/PingOrb";
import { HOME_HERO_INSIGHT } from "@/components/home/home-demo-data";

export default function HomePingPanel() {
  return (
    <div className="gp-home-ping-panel w-full min-w-0">
      <div className="gp-home-ping-card relative overflow-hidden rounded-[2.25rem] p-7 min-[960px]:p-9">
        <span className="gp-home-panel-blob gp-home-panel-blob-mint" aria-hidden />
        <span className="gp-home-panel-blob gp-home-panel-blob-violet" aria-hidden />

        <div className="relative flex flex-col items-center px-2 text-center">
          <PingOrb size={208} variant="hero" />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-200/85">
            Meet Ping
          </p>
          <p className="mt-3 max-w-[17rem] text-[16px] leading-[1.65] text-white/88">
            &ldquo;I don&apos;t just look at tags. I learn{" "}
            <span className="font-medium text-white">why you play</span>.&rdquo;
          </p>
        </div>

        <div className="relative mt-8 space-y-3.5 px-1">
          <div className="gp-home-ping-bubble-user ml-auto max-w-[90%] rounded-[1.25rem] rounded-br-lg px-4 py-3 text-[14px] leading-relaxed text-white/82">
            &ldquo;{HOME_HERO_INSIGHT.input}&rdquo;
          </div>

          <div className="gp-home-ping-bubble-ping rounded-[1.25rem] rounded-bl-lg px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200/75">
              Ping understands
            </p>
            <ul className="mt-2.5 space-y-2">
              {HOME_HERO_INSIGHT.understands.map((item) => (
                <li key={item.label} className="flex gap-2 text-sm">
                  <span className="shrink-0 font-medium text-white/50">{item.label}:</span>
                  <span className="text-white/88">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="relative mt-5 flex flex-wrap justify-center gap-2 px-1">
          {HOME_HERO_INSIGHT.outputs.map((item, i) => {
            const dot = ["bg-teal-300", "bg-violet-300", "bg-rose-300", "bg-amber-300"][i % 4];
            return (
              <li
                key={item}
                className="gp-home-ping-chip flex items-center gap-2 rounded-full px-3.5 py-2 text-xs text-white/72"
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
