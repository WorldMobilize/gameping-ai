import Link from "next/link";
import type { GameBreadcrumbItem } from "@/lib/seo/game-page";

type Props = {
  items: GameBreadcrumbItem[];
  className?: string;
  theme?: "dark" | "light";
};

export default function GameBreadcrumbs({ items, className, theme = "dark" }: Props) {
  if (!items.length) return null;

  const isLight = theme === "light";
  const defaultClass = isLight
    ? "flex max-w-3xl flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-slate-500"
    : "flex max-w-3xl flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-white/65";

  return (
    <nav aria-label="Breadcrumb" className={className ?? defaultClass}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-x-2">
              {index > 0 ? (
                <span className={isLight ? "text-slate-300" : "text-white/25"} aria-hidden="true">
                  /
                </span>
              ) : null}
              {isLast || !item.href ? (
                <span
                  className={
                    isLight
                      ? "rounded-lg px-2 py-1 text-slate-800"
                      : "rounded-lg px-2 py-1 text-white/85"
                  }
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={
                    isLight
                      ? "rounded-lg px-2 py-1 transition hover:bg-slate-100 hover:text-cyan-800"
                      : "rounded-lg px-2 py-1 transition hover:bg-white/10 hover:text-cyan-200"
                  }
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
