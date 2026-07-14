"use client";

/** Floating zoom controls — glass buttons matching the GamePing dark language. */
export default function MapToolbar({
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  const btn =
    "flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-[#0a0d1e]/85 text-white/80 backdrop-blur-md transition hover:border-blue-400/50 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60";

  return (
    <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
      <button type="button" aria-label="Zoom in" className={btn} onClick={onZoomIn}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button type="button" aria-label="Zoom out" className={btn} onClick={onZoomOut}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M5 12h14" />
        </svg>
      </button>
      <button type="button" aria-label="Reset view" className={btn} onClick={onReset}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>
      </button>
    </div>
  );
}
