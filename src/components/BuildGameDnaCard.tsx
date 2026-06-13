import Link from "next/link";

const STEAM_SETTINGS_HREF = "/settings/account#steam-library-import";

export default function BuildGameDnaCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0b14]/50 p-7 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
        Personal fit
      </p>
      <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">
        Unlock personal fit insights
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-white/60">
        Connect your Steam library and GamePing can explain whether each game matches your
        taste—not just its genre tags.
      </p>
      <p className="mt-3 text-sm text-white/40">
        Gaming DNA powers fit on game pages. Search recommendations are coming next.
      </p>
      <div className="mt-8">
        <Link
          href={STEAM_SETTINGS_HREF}
          className="inline-flex rounded-full bg-cyan-400 px-8 py-3.5 text-sm font-bold text-black transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b14]"
        >
          Connect Steam
        </Link>
      </div>
    </div>
  );
}
