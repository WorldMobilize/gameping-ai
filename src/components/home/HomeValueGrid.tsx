import Link from "next/link";

const VALUES = [
  {
    stat: "5",
    unit: "picks",
    title: "Curated, not infinite",
    text: "Strong matches with reasons—not another overwhelming backlog.",
  },
  {
    stat: "Live",
    unit: "prices",
    title: "Deal-aware pages",
    text: "Verified store prices when you open a game—not guesswork.",
  },
  {
    stat: "DNA",
    unit: "fit",
    title: "Taste that grows",
    text: "Connect Steam for personal fit on game pages. Search DNA coming next.",
    href: "/settings/account#steam-library-import",
  },
];

export default function HomeValueGrid() {
  return (
    <section className="border-y border-white/[0.06] bg-[#070810]/50 px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3 md:gap-5">
        {VALUES.map((item) => {
          const inner = (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-cyan-300">
                  {item.stat}
                </span>
                <span className="text-sm font-medium uppercase tracking-wider text-white/35">
                  {item.unit}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white/90">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">{item.text}</p>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.title}
                href={item.href}
                className="gp-home-value-card block rounded-2xl border border-white/[0.08] bg-[#0a0b12]/60 p-6 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
              >
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={item.title}
              className="gp-home-value-card rounded-2xl border border-white/[0.08] bg-[#0a0b12]/60 p-6"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
