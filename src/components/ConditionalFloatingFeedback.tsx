"use client";

import FloatingFeedbackButton from "@/components/FloatingFeedbackButton";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = new Set(["/verify-success"]);

export default function ConditionalFloatingFeedback() {
  const pathname = usePathname();
  if (pathname && HIDDEN_PATHS.has(pathname)) {
    return null;
  }
  return <FloatingFeedbackButton />;
}
