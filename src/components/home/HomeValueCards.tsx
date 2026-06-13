import { HOME_VALUE_PROPS } from "@/components/home/home-demo-data";
import { HomeValuePropIcon } from "@/components/home/HomeValuePropIcons";

const TONES = ["mint", "violet", "coral", "amber"] as const;

export default function HomeValueCards() {
  return (
    <ul className="gp-feature-row mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {HOME_VALUE_PROPS.map((prop, i) => {
        const tone = TONES[i % 4];
        return (
          <li key={prop.id} className={`gp-feature-card gp-feature-${tone}`}>
            <span className="gp-feature-icon">
              <HomeValuePropIcon id={prop.id} />
            </span>
            <p className="gp-feature-title mt-4 text-center text-[15px] font-semibold leading-snug">
              {prop.label}
            </p>
            <p className="mt-2 text-center text-sm leading-6 text-white/52">{prop.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}
