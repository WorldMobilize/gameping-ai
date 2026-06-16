import Image from "next/image";
import Link from "next/link";
import { APP_CARD, APP_MUTED } from "@/components/app/app-styles";
import { gameDetailPath } from "@/lib/curated/game-links";
import type { WeeklyPersonalPick } from "@/lib/discovery/placeholder-data";

export default function WeeklyPickCard({ pick }: { pick: WeeklyPersonalPick }) {
  const href = gameDetailPath(pick.title);

  return (
    <article className={`flex h-full flex-col overflow-hidden ${APP_CARD} p-0`}>
      <Link href={href} className="group relative block aspect-[460/215] overflow-hidden bg-slate-100">
        <Image
          src={pick.image}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-extrabold text-slate-900">
            <Link href={href} className="transition hover:text-cyan-700">
              {pick.title}
            </Link>
          </h3>
          <span className="shrink-0 rounded-full border border-cyan-200/80 bg-cyan-50 px-3 py-1 text-xs font-semibold tabular-nums text-cyan-800">
            {pick.match}% fit
          </span>
        </div>
        <p className={`mt-3 text-sm leading-6 ${APP_MUTED}`}>{pick.reason}</p>
      </div>
    </article>
  );
}
