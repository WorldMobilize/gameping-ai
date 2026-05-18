"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

const STANDALONE_PATHS = new Set(["/verify-success"]);

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname && STANDALONE_PATHS.has(pathname)) {
    return null;
  }
  return <Footer />;
}
