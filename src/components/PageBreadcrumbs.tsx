import GameBreadcrumbs from "@/components/GameBreadcrumbs";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/game-structured-data";

type Props = {
  items: GameBreadcrumbItem[];
  theme?: "dark" | "light";
  className?: string;
};

/**
 * Shared breadcrumb for public content pages: renders the visible breadcrumb nav
 * and the matching BreadcrumbList JSON-LD. Use ONLY on public/indexable pages —
 * never on account, auth, or noindex pages. Game detail pages keep their own
 * combined breadcrumb + VideoGame graph (see GameStructuredData).
 */
export default function PageBreadcrumbs({ items, theme = "dark", className }: Props) {
  if (!items.length) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    ...buildBreadcrumbListJsonLd(items),
  };

  return (
    <>
      <GameBreadcrumbs items={items} theme={theme} className={className} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
