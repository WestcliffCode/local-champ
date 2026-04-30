import * as React from 'react';
import { Search } from 'lucide-react';

import { cn } from '../utils/cn';
import { Input } from './ui/input';
import { Button } from './ui/button';

export interface DirectoryHeroProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** When provided, renders a search form that submits GET to this URL with `q` as query param. */
  searchAction?: string;
  searchPlaceholder?: string;
  searchDefaultValue?: string;
}

/**
 * DirectoryHero is the top-of-page section for both city landing pages and
 * city-scoped search results. The optional search form uses a plain
 * `method="get"` submission — the browser navigates to
 * `${searchAction}?q=${value}` without JavaScript, which keeps the page
 * server-renderable and progressively enhances on the client.
 */
export function DirectoryHero({
  title,
  subtitle,
  searchAction,
  searchPlaceholder = 'Search the directory…',
  searchDefaultValue,
  className,
  children,
  ...props
}: DirectoryHeroProps) {
  return (
    <section
      className={cn(
        'border-b border-border bg-gradient-to-b from-background to-muted/30 px-6 py-12 sm:py-16 md:py-20',
        className,
      )}
      {...props}
    >
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        )}
        {searchAction && (
          <form
            action={searchAction}
            method="get"
            role="search"
            className="mt-8 flex w-full max-w-xl mx-auto items-center gap-2"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                name="q"
                type="search"
                placeholder={searchPlaceholder}
                defaultValue={searchDefaultValue}
                className="h-11 pl-9 text-base"
                aria-label="Search the directory"
              />
            </div>
            <Button type="submit" size="lg">
              Search
            </Button>
          </form>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
