import { ChevronRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BreadcrumbsProps = {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  homeHref?: string;
  className?: string;
};

export function Breadcrumbs({
  items = [],
  showHome = true,
  homeHref = "/dashboard",
  className,
}: BreadcrumbsProps) {
  if (items.length === 0 && !showHome) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-neutral-500">
        {showHome && (
          <li>
            <Link
              href={homeHref}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </li>
        )}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-1"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "font-medium",
                    isLast ? "text-foreground" : "text-neutral-500",
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-foreground">
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
