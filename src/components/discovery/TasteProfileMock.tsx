import { APP_MUTED, APP_SUBHEADING } from "@/components/app/app-styles";

type Props = {
  signals: readonly string[];
};

export default function TasteProfileMock({ signals }: Props) {
  return (
    <div className="rounded-3xl border border-[color:var(--page-accent-border)] bg-white p-6 shadow-sm dark:bg-slate-900/70 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--page-accent-text)]">
        Taste profile mock
      </p>
      <h2 className={`mt-3 ${APP_SUBHEADING}`}>Your current signals</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        {signals.map((signal) => (
          <span
            key={signal}
            className="rounded-full border border-[color:var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--page-accent-text)] shadow-sm"
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
