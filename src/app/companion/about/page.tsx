import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppPageShell from "@/components/app/AppPageShell";
import ProductOverviewView from "@/components/products/ProductOverviewView";
import { getProductOverview } from "@/lib/product-overviews";
import { buildPublicPageMetadata } from "@/lib/seo/site";

const product = getProductOverview("companion");

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Desktop Companion — Your in-game gaming assistant | GamePing AI",
  description:
    "GamePing Companion is a premium desktop assistant with an in-game overlay, voice, maps, walkthroughs, and contextual help — no alt-tab required. Product overview.",
  path: "/companion/about",
});

export default function CompanionAboutPage() {
  if (!product) notFound();
  return (
    <AppPageShell hideAmbient>
      <div className="relative isolate min-h-0 flex-1" style={{ backgroundColor: "var(--gp-bg-base)" }}>
        <ProductOverviewView product={product} />
      </div>
    </AppPageShell>
  );
}
