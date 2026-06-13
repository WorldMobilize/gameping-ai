import { HOME_FLOW_STEPS, HOME_TRUST_PILLARS } from "@/components/home/home-demo-data";
import { HomeStepIcon, HomeTrustPillarIcon } from "@/components/home/HomeStepIcons";
import HomePageAtmosphere from "@/components/home/HomePageAtmosphere";
import PingOrb from "@/components/home/PingOrb";

const STEP_TONES = ["mint", "violet", "coral"] as const;

export default function HomeHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="gp-landing-section scroll-mt-24"
      aria-labelledby="home-how-heading"
    >
      <HomePageAtmosphere variant="section" />

      <div className="gp-landing-wrap relative z-10">
        <div className="gp-landing-shell">
          <div className="flex flex-col gap-6 min-[960px]:flex-row min-[960px]:items-start min-[960px]:justify-between">
            <div className="max-w-lg">
              <p className="gp-landing-kicker">How it works</p>
              <h2 id="home-how-heading" className="gp-landing-h2 mt-3">
                Ping helps you find your next{" "}
                <span className="gp-landing-accent">favorite</span> game
              </h2>
            </div>

            <div className="flex max-w-md items-start gap-3 min-[960px]:pt-1">
              <PingOrb size={48} variant="compact" bars={3} className="shrink-0" />
              <p className="gp-landing-speech text-sm leading-relaxed text-white/75">
                Tell me what you feel like playing — I&apos;ll help you find games worth
                your time.
              </p>
            </div>
          </div>

          <ol className="gp-landing-steps">
            {HOME_FLOW_STEPS.map((step, i) => {
              const tone = STEP_TONES[i % 3];
              return (
                <li key={step.step} className="gp-landing-step-wrap">
                  <div className={`gp-landing-step gp-landing-step-${tone}`}>
                    <span className={`gp-landing-step-num gp-landing-step-num-${tone}`}>
                      {step.step}
                    </span>
                    <span className={`gp-landing-step-icon gp-landing-step-icon-${tone}`}>
                      <HomeStepIcon id={step.icon} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold leading-snug text-white/95">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/52">{step.text}</p>
                  </div>
                  {i < HOME_FLOW_STEPS.length - 1 ? (
                    <span className="gp-landing-step-arrow" aria-hidden>
                      <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
                        <path
                          d="M0 8h20m0 0-5-5m5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>

          <ul className="gp-landing-pillars">
            {HOME_TRUST_PILLARS.map((pillar) => (
              <li key={pillar.id} className="gp-landing-pillar">
                <span className="gp-landing-pillar-icon">
                  <HomeTrustPillarIcon id={pillar.icon} />
                </span>
                {pillar.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
