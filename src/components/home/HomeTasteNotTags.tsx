import HomePageAtmosphere from "@/components/home/HomePageAtmosphere";

export default function HomeTasteNotTags() {
  return (
    <section className="gp-landing-section" aria-labelledby="home-taste-heading">
      <HomePageAtmosphere variant="section" />

      <div className="gp-landing-wrap relative z-10">
        <div className="gp-landing-shell">
          <div className="max-w-2xl">
            <p className="gp-landing-kicker">Taste, not tags</p>
            <h2 id="home-taste-heading" className="gp-landing-h2 mt-3">
              Ping understands why you like games—not just what box they check.
            </h2>
            <p className="gp-landing-body mt-4">
              Genre filters miss the motivations that actually keep you playing. Ping
              matches on feel, freedom, progression, and the stories you want to tell.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="gp-landing-panel">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/38">
                Tag-based search
              </p>
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {["RPG", "Open World", "Fantasy"].map((tag) => (
                    <span key={tag} className="gp-landing-chip">{tag}</span>
                  ))}
                </div>
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium text-white/68">Suggested match</p>
                  <p className="mt-1 text-lg font-semibold text-white/90">The Witcher 3</p>
                  <p className="mt-2 text-sm text-white/45">
                    Matches tags. May not match why you loved Fallout.
                  </p>
                </div>
              </div>
            </div>

            <div className="gp-landing-panel gp-landing-panel-mint">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-200/75">
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
      </div>
    </section>
  );
}
