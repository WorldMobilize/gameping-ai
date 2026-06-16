"use client";

import type { RefObject } from "react";

type PingPromptInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  maxLength: number;
  disabled?: boolean;
  placeholder?: string;
  submitLabel?: string;
  className?: string;
  id?: string;
  fieldRef?: RefObject<HTMLTextAreaElement | null>;
  variant?: "default" | "command";
};

/** Compact PING prompt — admin experiment only. */
export default function PingPromptInput({
  value,
  onChange,
  onSubmit,
  onFocus,
  maxLength,
  disabled = false,
  placeholder = "Describe the games you want…",
  submitLabel = "Ask PING",
  className = "",
  id = "ping-prompt",
  fieldRef,
  variant = "default",
}: PingPromptInputProps) {
  const command = variant === "command";

  return (
    <form
      className={`gp-ping-prompt ${command ? "gp-ping-prompt-command" : ""} ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor={id} className="sr-only">
        Ask PING
      </label>
      <div className={command ? "gp-ping-prompt-command-row" : undefined}>
        {command ? (
          <span className="gp-ping-prompt-prefix" aria-hidden>
            &gt;
          </span>
        ) : null}
        <textarea
          ref={fieldRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          maxLength={maxLength}
          disabled={disabled}
          rows={command ? 1 : 2}
          placeholder={placeholder}
          className="gp-ping-prompt-field"
        />
      </div>
      <div className="gp-ping-prompt-footer">
        <span className="gp-ping-prompt-count tabular-nums">
          {value.length} / {maxLength}
        </span>
        <button type="submit" disabled={disabled || !value.trim()} className="gp-ping-prompt-submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
