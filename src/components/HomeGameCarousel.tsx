import Image from "next/image";
import Link from "next/link";
import { gameDetailPath } from "@/lib/curated/game-links";
import { HOME_CAROUSEL_PICKS } from "@/lib/curated/home-picks";

export default function HomeGameCarousel() {
  const loop = [...HOME_CAROUSEL_PICKS, ...HOME_CAROUSEL_PICKS];

  return (
    <section
      className="relative mb-8 border-y border-white/10 bg-[#070816]/80 pt-14 pb-16 md:mb-12 md:pt-16 md:pb-20"
      aria-labelledby="home-game-carousel-heading"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-16 bg-gradient-to-r from-[#05060f] to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-16 bg-gradient-to-l from-[#05060f] to-transparent md:w-24" />

      <div className="relative z-[2] mx-auto max-w-6xl px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              Explore
            </p>
            <h2
              id="home-game-carousel-heading"
              className="mt-2 text-2xl font-black md:text-3xl"
            >
              Popular picks on GamePing AI
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              Discover games by mood, vibe, or taste—hover to pause the drift, or scroll on your
              phone.
            </p>
          </div>

          <Link
            href="/games"
            className="text-sm font-bold text-cyan-300/90 underline-offset-4 transition hover:text-cyan-200 hover:underline"
          >
            Browse A–Z directory →
          </Link>
        </div>
      </div>

      <div className="home-carousel-viewport relative z-[2] w-full">
        <div className="home-carousel-track px-6 md:px-10">
          {loop.map((game, index) => (
            <article
              key={`${game.title}-${index}`}
              className="group relative w-[min(280px,78vw)] shrink-0 overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:border-cyan-400/35 hover:bg-cyan-400/[0.06]"
            >
              <div className="relative aspect-[460/215] w-full overflow-hidden bg-black/40">
                <Image
                  src={game.image}
                  alt={`${game.title} header art`}
                  fill
                  sizes="(max-width: 768px) 78vw, 280px"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  priority={index < 4}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/20 to-transparent" />
              </div>

              <div className="space-y-3 p-5 pt-4">
                <div>
                  <h3 className="text-lg font-black leading-tight">{game.title}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/45">
                    {game.tag}
                  </p>
                </div>

                <Link
                  href={gameDetailPath(game.title)}
                  className="inline-flex w-full items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-400/10 py-2.5 text-sm font-black text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/20"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
