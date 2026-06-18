import { APP_CARD_LG, APP_KICKER, APP_MUTED, APP_SECTION_TITLE } from "@/components/app/app-styles";
import DiscoveryComingSoonBadge from "@/components/discovery/DiscoveryComingSoonBadge";

type Props = {
  title: string;
  bullets: string[];
};

export default function DiscoveryFutureCard({ title, bullets }: Props) {
  return (
    <div className={`${APP_CARD_LG} p-8`}>
      <div className="flex flex-wrap items-center gap-3">
        <p className={APP_KICKER}>
          Future discovery engine
        </p>
        <DiscoveryComingSoonBadge />
      </div>
      <h2 className={`mt-3 ${APP_SECTION_TITLE}`}>{title}</h2>
      <ul className={`mt-6 space-y-3 ${APP_MUTED}`}>
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2 text-slate-700 dark:text-slate-300">
            <span className="font-bold text-emerald-600" aria-hidden>
              ✓
            </span>
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}
