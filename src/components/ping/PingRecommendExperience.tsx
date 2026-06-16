"use client";

import { useEffect, useRef } from "react";
import PingAssistant, {
  type PingAssistantState,
  type PingAssistantSize,
} from "@/components/ping/PingAssistant";
import PingPromptInput from "@/components/ping/PingPromptInput";

type PingRecommendExperienceProps = {
  assistantState: PingAssistantState;
  assistantMessage: string;
  assistantSize?: PingAssistantSize;
  askedPrompt?: string | null;
  showPromptInput?: boolean;
  promptValue?: string;
  onPromptChange?: (value: string) => void;
  onPromptSubmit?: () => void;
  onEditPrompt?: () => void;
  promptMax?: number;
  promptDisabled?: boolean;
  children: React.ReactNode;
};

/** Admin-only PING recommend interface — replaces legacy form/header. */
export default function PingRecommendExperience({
  assistantState,
  assistantMessage,
  assistantSize = "hero",
  askedPrompt = null,
  showPromptInput = false,
  promptValue = "",
  onPromptChange,
  onPromptSubmit,
  onEditPrompt,
  promptMax = 2000,
  promptDisabled = false,
  children,
}: PingRecommendExperienceProps) {
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!showPromptInput) return;
    window.requestAnimationFrame(() => promptRef.current?.focus());
  }, [showPromptInput]);

  const showWelcome =
    assistantState === "awake" && !askedPrompt && !showPromptInput && !assistantMessage.includes("because");

  return (
    <div className="gp-ping-recommend">
      <header className="gp-ping-recommend-header">
        <PingAssistant
          variant="core"
          state={assistantState}
          size={assistantSize}
          message={
            showWelcome || (askedPrompt && !showPromptInput)
              ? undefined
              : assistantMessage
          }
          statusText="PING online"
          headline={showWelcome ? "Welcome back." : undefined}
          subline={showWelcome ? "What are we looking for today?" : undefined}
          askedPrompt={askedPrompt && !showPromptInput ? askedPrompt : null}
          onAskSomethingElse={onEditPrompt}
          inputOpen={showPromptInput}
        >
          {showPromptInput && onPromptChange && onPromptSubmit ? (
            <PingPromptInput
              fieldRef={promptRef}
              value={promptValue}
              onChange={onPromptChange}
              onSubmit={onPromptSubmit}
              maxLength={promptMax}
              disabled={promptDisabled}
              placeholder="Tell PING what you feel like playing..."
              submitLabel="Ask PING"
              variant="command"
              className="gp-ping-prompt-styled"
            />
          ) : null}
        </PingAssistant>
      </header>
      {children}
    </div>
  );
}
