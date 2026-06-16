import { APP_CTA_PANEL } from "@/components/app/app-styles";

type Props = {
  signals: readonly string[];
};

export default function TasteProfileMock({ signals }: Props) {
  return (
    <div className={`${APP_CTA_PANEL} p-6 md:p-8`}>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-700">
        Taste profile mock
      </p>
      <h2 className="mt-3 text-xl font-extrabold text-slate-900">Your current signals</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        {signals.map((signal) => (
          <span
            key={signal}
            className="rounded-full border border-cyan-200/80 bg-white px-4 py-2 text-sm font-semibold text-cyan-900 shadow-sm"
          >
            {signal}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Static demo only — future weekly picks will blend real searches, saves, and library data.
      </p>
    </div>
  );
}
