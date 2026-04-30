import * as React from 'react';
import { ArrowRight } from 'lucide-react';

import { cn } from '../utils/cn';

export type CityCardCity = {
  slug: string;
  displayName: string;
  state: string;
  region?: string | null;
  heroImageUrl?: string | null;
};

export interface CityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  city: CityCardCity;
}

/**
 * CityCard is the primary tile on the marketing home's "find your city"
 * grid. It does NOT wrap with a Link — callers compose with their router's
 * link primitive: `<Link href={`/${city.slug}`}><CityCard city={city} /></Link>`.
 *
 * Visual treatment:
 *   - When `heroImageUrl` is present: image fills the card with a gradient
 *     scrim at the bottom; city name and state overlay the scrim.
 *   - When absent: solid Heritage-tone background with city name centered.
 */
export function CityCard({ city, className, ...props }: CityCardProps) {
  const hasHero = Boolean(city.heroImageUrl);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border shadow-sm transition-all',
        'hover:shadow-md hover:border-foreground/20',
        'aspect-[4/3]',
        hasHero ? 'bg-foreground' : 'bg-primary',
        className,
      )}
      {...props}
    >
      {hasHero && (
        <img
          src={city.heroImageUrl ?? undefined}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      {hasHero && (
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
        />
      )}
      <div
        className={cn(
          'relative z-10 flex h-full flex-col justify-end p-6',
          hasHero ? 'text-white' : 'text-primary-foreground',
        )}
      >
        <h3 className="text-2xl font-bold leading-tight">
          {city.displayName}
        </h3>
        <div className="mt-1 flex items-center justify-between text-sm opacity-90">
          <span>
            {city.state}
            {city.region && ` · ${city.region}`}
          </span>
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
