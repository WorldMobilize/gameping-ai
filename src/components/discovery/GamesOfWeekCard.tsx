import Image from "next/image";
import Link from "next/link";
import { APP_CARD, APP_MUTED } from "@/components/app/app-styles";
import { gameDetailPath } from "@/lib/curated/game-links";
import type { GamesOfWeekPick } from "@/lib/discovery/placeholder-data";

const CATEGORY_STYLES: Record<GamesOfWeekPick["category"], string> = {
  "New discovery": "border-cyan-200/90 bg-cyan-50 text-cyan-900",
  "Great deal": "border-emerald-200/90 bg-emerald-50 text-emerald-900",
  "Community favorite": "border-violet-200/90 bg-violet-50 text-violet-900",
};

export default function GamesOfWeekCard({ pick }: { pick: GamesOfWeekPick }) {
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
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${CATEGORY_STYLES[pick.category]}`}
          >
            {pick.category}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-extrabold text-slate-900">
          <Link href={href} className="transition hover:text-cyan-700">
            {pick.title}
          </Link>
        </h3>
        <p className={`mt-3 flex-1 text-sm leading-6 ${APP_MUTED}`}>{pick.whyThisWeek}</p>
      </div>
    </article>
  );
}
