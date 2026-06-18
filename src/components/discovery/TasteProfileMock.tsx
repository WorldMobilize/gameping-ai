import { APP_CTA_PANEL, APP_MUTED, APP_SUBHEADING } from "@/components/app/app-styles";

type Props = {
  signals: readonly string[];
};

export default function TasteProfileMock({ signals }: Props) {
  return (
    <div className={`${APP_CTA_PANEL} p-6 md:p-8`}>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700 dark:text-violet-400">
        Taste profile mock
      </p>
      <h2 className={`mt-3 ${APP_SUBHEADING}`}>Your current signals</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        {signals.map((signal) => (
          <span
            key={signal}
            className="rounded-full border border-cyan-200/80 bg-white px-4 py-2 text-sm font-semibold text-cyan-900 shadow-sm dark:border-cyan-800/60 dark:bg-cyan-950/40 dark:text-cyan-200"
          >
            {signal}
          </span>
        ))}
      </div>
      <p className={`mt-4 ${APP_MUTED}`}>
        Static demo only — future weekly picks will blend real searches, saves, and library data.
      </p>
    </div>
  );
}
