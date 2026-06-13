import { HOME_VALUE_PROPS } from "@/components/home/home-demo-data";
import { HomeValuePropIcon } from "@/components/home/HomeValuePropIcons";

const TONES = ["mint", "violet", "coral", "amber"] as const;

export default function HomeFeatureCards() {
  return (
    <section className="gp-landing-features" aria-label="What GamePing offers">
      <div className="gp-landing-wrap">
        <ul className="gp-landing-feature-grid">
          {HOME_VALUE_PROPS.map((prop, i) => {
            const tone = TONES[i % 4];
            return (
              <li key={prop.id} className={`gp-landing-feature gp-landing-feature-${tone}`}>
                <span className="gp-landing-feature-icon">
                  <HomeValuePropIcon id={prop.id} />
                </span>
                <h3 className="mt-5 text-[15px] font-semibold leading-snug text-white/92">
                  {prop.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{prop.detail}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
