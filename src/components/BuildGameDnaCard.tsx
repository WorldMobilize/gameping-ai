import Link from "next/link";

const STEAM_SETTINGS_HREF = "/settings/account#steam-library-import";

export default function BuildGameDnaCard() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
      <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Personal fit</p>
      <h2 className="mt-4 text-3xl font-black">Build your Game DNA</h2>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
        Connect your Steam library and GamePing can explain whether each game fits your taste.
      </p>
      <p className="mt-4 text-sm text-white/40">
        Taste-based recommendations are coming next. Personal fit uses your imported Steam
        playtime.
      </p>
      <div className="mt-8">
        <Link
          href={STEAM_SETTINGS_HREF}
          className="inline-flex rounded-full bg-white px-8 py-4 text-base font-black text-black shadow-[0_0_24px_rgba(255,255,255,0.1)] transition hover:bg-cyan-100"
        >
          Connect Steam
        </Link>
      </div>
    </div>
  );
}
