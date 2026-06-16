"use client";

import { type ReactNode } from "react";
import PingOrb from "@/components/home/PingOrb";

export type PingAssistantState =
  | "sleeping"
  | "awake"
  | "idle"
  | "typing"
  | "searching"
  | "complete"
  | "inspecting";

export type PingAssistantSize = "sm" | "md" | "lg" | "hero";
/** @deprecated "core" maps to the simple text fallback — visual prototype removed */
export type PingAssistantVariant = "panel" | "core";

type PingAssistantProps = {
  state?: PingAssistantState;
  size?: PingAssistantSize;
  variant?: PingAssistantVariant;
  message?: string;
  headline?: string;
  subline?: string;
  statusText?: string;
  inputOpen?: boolean;
  onActivate?: () => void;
  askedPrompt?: string | null;
  onAskSomethingElse?: () => void;
  children?: ReactNode;
  className?: string;
};

const SIZE_CLASS: Record<PingAssistantSize, string> = {
  sm: "gp-ping-console-sm",
  md: "gp-ping-console-md",
  lg: "gp-ping-console-lg",
  hero: "gp-ping-console-hero",
};

const ORB_SIZE: Record<PingAssistantSize, number> = {
  sm: 64,
  md: 80,
  lg: 96,
  hero: 112,
};

function defaultMessage(state: PingAssistantState): string {
  switch (state) {
    case "sleeping":
      return "PING standby";
    case "searching":
      return "Scanning your request…";
    case "complete":
      return "Found a few strong matches.";
    case "inspecting":
      return "Analyzing match data…";
    case "typing":
      return "Listening…";
    default:
      return "What are we looking for today?";
  }
}

function PingSimpleVariant({
  state = "idle",
  size = "lg",
  message,
  headline,
  subline,
  statusText,
  inputOpen = false,
  onActivate,
  askedPrompt = null,
  onAskSomethingElse,
  children,
  className = "",
}: PingAssistantProps) {
  const visualState = state === "idle" ? "awake" : state;
  const displayStatus =
    statusText ?? (visualState === "sleeping" ? "PING standby" : "PING online");
  const displayMessage = message ?? defaultMessage(visualState);
  const hasWelcomeCopy = Boolean(headline || subline);
  const showDynamicMessage =
    !hasWelcomeCopy &&
    (visualState === "searching" ||
      visualState === "complete" ||
      visualState === "inspecting" ||
      Boolean(message));
  const showAskCta =
    onActivate &&
    !inputOpen &&
    visualState !== "sleeping" &&
    visualState !== "searching" &&
    !askedPrompt;
  const showAskedBlock = Boolean(askedPrompt && !inputOpen);

  return (
    <div
      className={`gp-ping-assistant-simple gp-ping-assistant-simple-${size} gp-ping-assistant-simple-${visualState} ${className}`}
      aria-label="PING assistant"
    >
      <div className="gp-ping-assistant-simple-visual" aria-hidden>
        <PingOrb size={ORB_SIZE[size]} variant="compact" />
      </div>

      <p className="gp-ping-assistant-simple-status">{displayStatus}</p>

      {hasWelcomeCopy ? (
        <div className="gp-ping-assistant-simple-copy" aria-live="polite">
          {headline ? <p className="gp-ping-assistant-simple-headline">{headline}</p> : null}
          {subline ? <p className="gp-ping-assistant-simple-subline">{subline}</p> : null}
        </div>
      ) : showDynamicMessage ? (
        <p className="gp-ping-assistant-simple-message" aria-live="polite">
          {displayMessage}
        </p>
      ) : null}

      {showAskedBlock ? (
        <div className="gp-ping-assistant-simple-asked">
          <p className="gp-ping-assistant-simple-asked-text">
            You asked: <span>{askedPrompt}</span>
          </p>
          {onAskSomethingElse ? (
            <button
              type="button"
              onClick={onAskSomethingElse}
              className="gp-ping-assistant-simple-asked-edit"
            >
              Ask something else
            </button>
          ) : null}
        </div>
      ) : null}

      {showAskCta ? (
        <button type="button" onClick={onActivate} className="gp-ping-assistant-simple-cta">
          Ask PING
        </button>
      ) : null}

      {children ? (
        <div
          className={`gp-ping-assistant-simple-input-wrap ${inputOpen ? "gp-ping-assistant-simple-input-wrap-open" : ""}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function PingPanelVariant({
  state = "idle",
  size = "lg",
  message,
  className = "",
}: PingAssistantProps) {
  const visualState = state === "idle" ? "awake" : state;
  const displayMessage = message ?? defaultMessage(visualState);
  const showMessage = visualState !== "sleeping" || message;
  const glitch = visualState === "searching";

  return (
    <div
      className={`gp-ping-console ${SIZE_CLASS[size]} gp-ping-console-${visualState} ${glitch ? "gp-ping-console-glitch" : ""} ${className}`}
      role="img"
      aria-label={displayMessage ? `PING assistant: ${displayMessage}` : "PING assistant"}
    >
      <span className="gp-ping-console-grid" aria-hidden />
      <span className="gp-ping-console-scanlines" aria-hidden />

      <header className="gp-ping-console-topbar">
        <span className="gp-ping-console-brand">PING</span>
        <span className="gp-ping-console-status">
          <span className="gp-ping-console-state">online</span>
        </span>
      </header>

      <div className="gp-ping-console-center">
        <PingOrb size={ORB_SIZE[size]} variant="default" />
      </div>

      {showMessage ? (
        <p className="gp-ping-console-message" aria-live="polite">
          {displayMessage}
        </p>
      ) : (
        <p className="gp-ping-console-message gp-ping-console-message-dim" aria-live="polite">
          PING standby
        </p>
      )}

      <footer className="gp-ping-console-footer">
        <span className="gp-ping-console-prefix" aria-hidden>
          &gt;
        </span>
        <span className="gp-ping-console-prompt-hint">
          {visualState === "sleeping" ? "awaiting input" : "ready for query"}
        </span>
      </footer>
    </div>
  );
}

/** Minimal PING assistant — safe CSS orb + status text fallback. */
export default function PingAssistant(props: PingAssistantProps) {
  if (props.variant === "core") {
    return <PingSimpleVariant {...props} />;
  }
  return <PingPanelVariant {...props} />;
}
