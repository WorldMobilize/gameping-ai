import Image from "next/image";
import Link from "next/link";
import { APP_CARD, APP_CARD_TITLE, APP_MUTED } from "@/components/app/app-styles";
import { gameDetailPath } from "@/lib/curated/game-links";
import type { DealForYouPick } from "@/lib/discovery/placeholder-data";

export default function DealForYouCard({ pick }: { pick: DealForYouPick }) {
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
        <h3 className={APP_CARD_TITLE}>
          <Link href={href} className="transition hover:text-cyan-700">
            {pick.title}
          </Link>
        </h3>
        <p className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-sm text-slate-400 line-through">{pick.oldPrice}</span>
          <span className="text-xl font-extrabold text-emerald-700">{pick.newPrice}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Demo prices
          </span>
        </p>
        <p className={`mt-3 flex-1 text-sm leading-6 ${APP_MUTED}`}>{pick.whyItMatches}</p>
      </div>
    </article>
  );
}
