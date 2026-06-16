import Link from "next/link";
import { APP_PRIMARY_CTA_SM } from "@/components/app/app-styles";

const STEAM_SETTINGS_HREF = "/settings/account#steam-library-import";

export default function BuildGameDnaCard() {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
        Personal fit
      </p>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 gp-home-display md:text-3xl">
        Unlock personal fit insights
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        Connect your Steam library and GamePing can explain whether each game matches your
        taste—not just its genre tags.
      </p>
      <p className="mt-3 text-sm text-slate-400">
        Gaming DNA powers fit on game pages. Search recommendations are coming next.
      </p>
      <div className="mt-8">
        <Link href={STEAM_SETTINGS_HREF} className={APP_PRIMARY_CTA_SM}>
          Connect Steam
        </Link>
      </div>
    </div>
  );
}
