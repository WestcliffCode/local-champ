import * as React from 'react';
import { ChevronRight } from 'lucide-react';

import { cn } from '../utils/cn';

export type BreadcrumbItem = {
  label: string;
  /** When omitted, the item renders as static text (used for the current page). */
  href?: string;
};

export interface BreadcrumbTrailProps
  extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

/**
 * Visual breadcrumb trail. Renders plain anchor tags for navigation —
 * callers using Next.js can wrap with `<Link>` if soft navigation matters,
 * but for the directory's nav-as-document-load case, the anchor default is
 * fine and SEO-friendly (crawlers see the links).
 *
 * The last item is rendered as plain text regardless of whether `href` is
 * provided (it's the current page).
 */
export function BreadcrumbTrail({
  items,
  className,
  ...props
}: BreadcrumbTrailProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)} {...props}>
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const showLink = !isLast && item.href;
          return (
            <li key={`${idx}-${item.label}`} className="flex items-center gap-1.5">
              {showLink ? (
                <a
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={cn(
                    isLast && 'font-medium text-foreground',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
