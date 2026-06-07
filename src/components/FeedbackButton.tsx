"use client";

import { useFeedback } from "@/components/FeedbackProvider";

type FeedbackButtonProps = {
  className?: string;
};

export default function FeedbackButton({ className = "" }: FeedbackButtonProps) {
  const { openFeedback } = useFeedback();

  return (
    <button
      type="button"
      onClick={openFeedback}
      className={
        className ||
        "text-left text-sm text-slate-400 transition hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
      }
    >
      Share feedback
    </button>
  );
}
