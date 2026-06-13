import HomeProductDemo from "@/components/home/HomeProductDemo";
import { HOME_FLOW_STEPS } from "@/components/home/home-demo-data";
import { HomeStepIcon } from "@/components/home/HomeStepIcons";
import PingOrb from "@/components/home/PingOrb";

const STEP_TONES = ["mint", "violet", "coral"] as const;

export default function HomeHowItWorks() {
  return (
    <section id="how-it-works" className="gp-pastel-section scroll-mt-24 px-5 py-20 min-[960px]:px-8 md:py-28 xl:px-10 2xl:px-16">
      <div className="gp-pastel-shell gp-flow-shell mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-6 min-[960px]:flex-row min-[960px]:items-start min-[960px]:justify-between">
          <div className="max-w-xl">
            <p className="gp-pastel-label">How it works</p>
            <h2 className="gp-pastel-section-title mt-3">
              Ping helps you find your next{" "}
              <span className="gp-pastel-accent">favorite</span> game
            </h2>
          </div>
          <div className="gp-ping-speech flex max-w-md items-start gap-3 min-[960px]:pt-2">
            <PingOrb size={44} variant="compact" bars={3} className="shrink-0" />
            <p className="gp-ping-bubble rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed text-white/78">
              I&apos;m Ping — tell me what mood you&apos;re in and I&apos;ll find games
              that fit <span className="text-teal-100">why</span> you play.
            </p>
          </div>
        </div>

        <ol className="gp-steps-row mt-12">
          {HOME_FLOW_STEPS.map((step, i) => {
            const tone = STEP_TONES[i % 3];
            return (
              <li key={step.step} className="gp-step-item">
                <div className={`gp-step-card gp-step-${tone}`}>
                  <span className={`gp-step-num gp-step-num-${tone}`}>{step.step}</span>
                  <span className={`gp-step-icon gp-step-icon-${tone} mt-5`}>
                    <HomeStepIcon id={step.icon} />
                  </span>
                  <h3 className="mt-4 text-base font-semibold leading-snug text-white/95">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">{step.text}</p>
                </div>
                {i < HOME_FLOW_STEPS.length - 1 ? (
                  <span className="gp-step-arrow hidden min-[960px]:flex" aria-hidden>
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

        <div className="gp-home-section-demo mt-14 min-w-0 w-full">
          <HomeProductDemo variant="section" />
        </div>
      </div>
    </section>
  );
}
