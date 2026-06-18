import Image from "next/image";
import Link from "next/link";
import { APP_CARD, APP_CARD_TITLE, APP_MUTED } from "@/components/app/app-styles";
import { gameDetailPath } from "@/lib/curated/game-links";
import type { HiddenGemPick } from "@/lib/discovery/placeholder-data";

const TAG_STYLES: Record<HiddenGemPick["tag"], string> = {
  Underrated: "border-amber-200/90 bg-amber-50 text-amber-900",
  "Cult favorite": "border-violet-200/90 bg-violet-50 text-violet-900",
  "Hidden RPG": "border-cyan-200/90 bg-cyan-50 text-cyan-900",
  "Small studio": "border-emerald-200/90 bg-emerald-50 text-emerald-900",
};

export default function HiddenGemCard({ pick }: { pick: HiddenGemPick }) {
  const href = gameDetailPath(pick.title);

  return (
    <article className={`flex h-full flex-col overflow-hidden ${APP_CARD} p-0`}>
      <Link href={href} className="group relative block aspect-[460/215] overflow-hidden bg-slate-100">
        <Image
          src={pick.image}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className={APP_CARD_TITLE}>
            <Link href={href} className="transition hover:text-cyan-700">
              {pick.title}
            </Link>
          </h3>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${TAG_STYLES[pick.tag]}`}
          >
            {pick.tag}
          </span>
        </div>
        <p className={`mt-3 flex-1 text-sm leading-6 ${APP_MUTED}`}>{pick.reason}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Future match{" "}
          <span className="tabular-nums text-cyan-700">{pick.futureMatch}%</span>
          <span className="ml-1 font-normal normal-case tracking-normal text-slate-400">
            (demo)
          </span>
        </p>
      </div>
    </article>
  );
}
