export default function HomeTasteNotTags() {
  return (
    <section className="gp-pastel-section px-5 py-20 md:py-28">
      <div className="gp-pastel-shell mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="gp-pastel-label">Taste, not tags</p>
          <h2 className="gp-pastel-section-title mt-3">
            Ping understands why you like games—not just what box they check.
          </h2>
          <p className="gp-pastel-section-sub mt-4">
            Genre filters miss the motivations that actually keep you playing. Ping
            matches on feel, freedom, progression, and the stories you want to tell.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2 lg:gap-6">
          <div className="gp-pastel-card-muted p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Tag-based search
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {["RPG", "Open World", "Fantasy"].map((tag) => (
                  <span key={tag} className="gp-pastel-chip">{tag}</span>
                ))}
              </div>
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-white/70">Suggested match</p>
                <p className="mt-1 text-lg font-semibold text-white/90">The Witcher 3</p>
                <p className="mt-2 text-sm text-white/45">
                  Matches tags. May not match why you loved Fallout.
                </p>
              </div>
            </div>
          </div>

          <div className="gp-pastel-card-accent gp-accent-mint p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-200/80">
              Ping taste match
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-white/[0.05] p-4">
                <p className="text-sm text-white/58">
                  You liked <span className="font-medium text-white/88">Fallout</span> because of
                </p>
                <ul className="mt-3 space-y-2 text-sm text-white/72">
                  {[
                    "Freedom to approach problems your way",
                    "Meaningful choices with consequences",
                    "Exploration and emergent stories",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-teal-300">✦</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-teal-400/10 p-4">
                <p className="text-sm font-medium text-white/78">Better-fit direction</p>
                <p className="mt-1 text-lg font-semibold text-white">Games with agency &amp; discovery</p>
                <p className="mt-2 text-sm text-white/52">
                  Picks ranked on motivations—not a single genre label.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
