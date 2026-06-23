/**
 * Premium background atmosphere for /upgrade — UI only.
 *
 * A single fixed premium cinematic image (the SAME image in light AND dark) sits
 * behind the page; a theme-aware readability overlay is baked into the CSS
 * (`.gp-upgrade-premium-bg` in upgrade-page.css) so pricing cards and copy stay
 * legible without switching to a plain background. The old animated ocean-current
 * ribbon/wave layers were removed so they no longer conflict with the image.
 */
export default function UpgradePageAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Premium cinematic background — same image in light + dark. */}
      <div className="gp-upgrade-premium-bg" />

      {/* Soft vignette for depth/framing (not a wave layer). */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_75%_at_50%_42%,transparent_0%,transparent_60%,rgb(15_23_42/0.06)_100%)] dark:bg-[radial-gradient(ellipse_92%_78%_at_50%_38%,transparent_0%,transparent_52%,rgb(0_0_0/0.45)_100%)]" />
    </div>
  );
}
