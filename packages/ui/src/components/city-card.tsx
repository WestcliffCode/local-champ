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

export function CityCard({ city, className, ...props }: CityCardProps) {
  const hasHero = Boolean(city.heroImageUrl);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg surface-card transition-all',
        'hover:glow-diamond hover:border-diamond/20',
        'aspect-[4/3]',
        hasHero ? 'bg-obsidian' : 'bg-surface-container-high',
        className,
      )}
      {...props}
    >
      {hasHero && (
        <img
          src={city.heroImageUrl ?? undefined}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80"
        />
      )}
      {hasHero && (
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-obsidian/90 via-obsidian/50 to-transparent"
        />
      )}
      <div
        className={cn(
          'relative z-10 flex h-full flex-col justify-end p-6',
          'text-on-surface',
        )}
      >
        <h3 className="text-2xl font-bold leading-tight font-display">
          {city.displayName}
        </h3>
        <div className="mt-1 flex items-center justify-between text-sm text-on-surface-variant">
          <span>
            {city.state}
            {city.region && ` · ${city.region}`}
          </span>
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 text-diamond"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
