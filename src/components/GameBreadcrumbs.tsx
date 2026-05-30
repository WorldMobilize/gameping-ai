import Link from "next/link";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";

type Props = {
  items: GameBreadcrumbItem[];
  className?: string;
};

export default function GameBreadcrumbs({ items, className }: Props) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={className ?? "flex max-w-3xl flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65"}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-x-2">
              {index > 0 ? (
                <span className="text-white/25" aria-hidden="true">
                  /
                </span>
              ) : null}
              {isLast || !item.href ? (
                <span
                  className="rounded-lg px-2 py-1 text-white/85"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="rounded-lg px-2 py-1 transition hover:bg-white/10 hover:text-cyan-200"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
