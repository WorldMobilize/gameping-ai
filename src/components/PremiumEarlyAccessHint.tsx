/** Compact Premium early-access roadmap (full Steam section lives on upgrade/home). */
export default function PremiumEarlyAccessHint() {
  return (
    <div
      className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
      title="Roadmap features included with early access"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/80">
        Early access roadmap
      </p>
      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-white/55">
        <li>Steam library import (coming soon)</li>
        <li>Persistent taste memory across sessions</li>
        <li>Smarter personalized recommendations</li>
      </ul>
    </div>
  );
}
