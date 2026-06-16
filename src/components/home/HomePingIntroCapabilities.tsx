"use client";

import { useCallback, useState } from "react";

const PING_CAPABILITIES = [
  {
    id: "mood",
    chipLabel: "Mood-aware",
    title: "Reads your mood",
    body: "Understands whether you want cozy, intense, emotional, social, short, or long-form games.",
    tone: "violet" as const,
  },
  {
    id: "taste",
    chipLabel: "Taste-matched",
    title: "Matches your taste",
    body: "Uses your favorite games, dislikes, pacing, mechanics, and vibe to find better picks.",
    tone: "cyan" as const,
  },
  {
    id: "explained",
    chipLabel: "Explained picks",
    title: "Explains every pick",
    body: "Shows why a game fits, what might not work, and whether it is worth your time.",
    tone: "violet" as const,
  },
] as const;

type CapabilityId = (typeof PING_CAPABILITIES)[number]["id"];

function CapabilityCard({
  title,
  body,
  tone,
  className = "",
}: {
  title: string;
  body: string;
  tone: "violet" | "cyan";
  className?: string;
}) {
  return (
    <article
      className={`gp-ping-intro-detail-card gp-landing-glass-card gp-landing-glass-card-${tone} ${className}`}
    >
      <h3 className="gp-ping-intro-detail-title">{title}</h3>
      <p className="gp-ping-intro-detail-body">{body}</p>
    </article>
  );
}

/** Desktop detail cards + mobile expandable chips for Meet PING. */
export default function HomePingIntroCapabilities() {
  const [activeId, setActiveId] = useState<CapabilityId | null>(null);

  const toggleChip = useCallback((id: CapabilityId) => {
    setActiveId((prev) => (prev === id ? null : id));
  }, []);

  const activeCapability = PING_CAPABILITIES.find((item) => item.id === activeId);

  return (
    <div className="gp-ping-intro-capabilities">
      <ul className="gp-ping-intro-cards" aria-label="PING capabilities">
        {PING_CAPABILITIES.map((item) => (
          <li key={item.id}>
            <CapabilityCard title={item.title} body={item.body} tone={item.tone} />
          </li>
        ))}
      </ul>

      <div className="gp-ping-intro-mobile">
        <ul className="gp-ping-intro-chips" role="tablist" aria-label="PING capabilities">
          {PING_CAPABILITIES.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="tab"
                  id={`ping-cap-tab-${item.id}`}
                  aria-selected={isActive}
                  aria-controls="ping-cap-panel"
                  className={`gp-ping-intro-chip ${isActive ? "gp-ping-intro-chip-active" : ""}`}
                  onClick={() => toggleChip(item.id)}
                >
                  {item.chipLabel}
                </button>
              </li>
            );
          })}
        </ul>

        <div
          id="ping-cap-panel"
          role="tabpanel"
          aria-labelledby={activeCapability ? `ping-cap-tab-${activeCapability.id}` : undefined}
          className={`gp-ping-intro-mobile-panel ${activeCapability ? "gp-ping-intro-mobile-panel-open" : ""}`}
          aria-live="polite"
        >
          {activeCapability ? (
            <CapabilityCard
              title={activeCapability.title}
              body={activeCapability.body}
              tone={activeCapability.tone}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
