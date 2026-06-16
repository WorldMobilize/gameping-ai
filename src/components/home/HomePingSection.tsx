import Image from "next/image";
import HomePingIntroCapabilities from "@/components/home/HomePingIntroCapabilities";

/** PING cinematic block — lab image and copy only. */
export default function HomePingSection() {
  return (
    <section className="gp-ping-intro relative" aria-labelledby="ping-intro-heading">
      <div className="gp-ping-intro-bg" aria-hidden>
        <Image
          src="/images/ping-core-lab.webp"
          alt=""
          fill
          loading="lazy"
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="gp-ping-intro-overlay" />
        <div className="gp-ping-intro-fade-top" />
        <div className="gp-ping-intro-fade-bottom" />
      </div>

      <div className="gp-ping-intro-stage gp-landing-wrap">
        <div className="gp-ping-intro-orbit-links" aria-hidden>
          <span className="gp-ping-intro-orbit-link gp-ping-intro-orbit-link-mood" />
          <span className="gp-ping-intro-orbit-link gp-ping-intro-orbit-link-taste" />
          <span className="gp-ping-intro-orbit-link gp-ping-intro-orbit-link-explained" />
        </div>

        <div className="gp-ping-intro-copy">
          <p className="gp-landing-kicker">AI companion</p>
          <h2 id="ping-intro-heading" className="gp-landing-h2 mt-3">
            Meet <span className="gp-landing-accent">PING.</span>
          </h2>
          <p className="mt-2 text-lg font-medium">
            Your AI gaming companion.
          </p>
          <p className="gp-landing-body mt-4 max-w-md">
            PING reads your mood, preferences, and favorite games to find recommendations
            that actually fit.
          </p>
        </div>

        <HomePingIntroCapabilities />
      </div>
    </section>
  );
}
