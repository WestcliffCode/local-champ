import * as React from 'react';
import { Search } from 'lucide-react';

import { cn } from '../utils/cn';
import { Input } from './ui/input';
import { Button } from './ui/button';

export interface DirectoryHeroProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  searchAction?: string;
  searchPlaceholder?: string;
  searchDefaultValue?: string;
}

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
        'border-b border-border surface-hero px-6 py-12 sm:py-16 md:py-20',
        className,
      )}
      {...props}
    >
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-display-lg text-foreground sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-body-base text-muted-foreground sm:text-lg">
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
                className="h-11 pl-9 text-base bg-surface-container border border-outline-variant rounded-lg"
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
