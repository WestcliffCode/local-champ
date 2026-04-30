import * as React from 'react';
import { Star } from 'lucide-react';

import { cn } from '../utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScoreBadge } from './score-badge';

/**
 * Minimal data shape for rendering a business card. Mirrors a subset of the
 * Drizzle `businesses` schema; intentionally flexible so callers can pass
 * either Drizzle rows or hand-shaped objects.
 */
export type BusinessCardBusiness = {
  name: string;
  slug: string;
  citySlug: string;
  categorySlug: string;
  starRating?: number | string | null;
  reviewCount?: number | string | null;
  cpsScore?: number | string | null;
  localLoopScore?: number | string | null;
};

export interface BusinessCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  business: BusinessCardBusiness;
  /** When true, hides score badges (useful in compact lists). */
  compact?: boolean;
}

/**
 * BusinessCard renders the visual representation of a business in directory
 * listings. It does NOT wrap with a Link — callers compose with their
 * router's link primitive (e.g. `<Link href={...}><BusinessCard /></Link>`).
 *
 * The hover style (shadow + border tint) applies regardless of wrapping so
 * the card feels interactive even when stacked with a Link.
 */
export function BusinessCard({
  business,
  compact = false,
  className,
  ...props
}: BusinessCardProps) {
  const rating =
    business.starRating != null ? Number(business.starRating) : null;
  const reviews =
    business.reviewCount != null ? Number(business.reviewCount) : null;
  const cps = business.cpsScore != null ? Number(business.cpsScore) : 0;
  const ll =
    business.localLoopScore != null ? Number(business.localLoopScore) : 0;

  return (
    <Card
      className={cn(
        'h-full transition-shadow hover:shadow-md hover:border-foreground/20',
        className,
      )}
      {...props}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{business.name}</CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[11px]">
            {business.categorySlug}
          </Badge>
          {rating != null && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" aria-hidden />
              <span className="font-medium text-foreground">
                {rating.toFixed(1)}
              </span>
              {reviews != null && reviews > 0 && (
                <span>({reviews.toLocaleString()})</span>
              )}
            </span>
          )}
        </div>
      </CardHeader>
      {!compact && (cps > 0 || ll > 0) && (
        <CardContent className="pt-0 flex flex-wrap gap-2">
          {cps > 0 && <ScoreBadge variant="cps" value={cps} />}
          {ll > 0 && <ScoreBadge variant="local-loop" value={ll} />}
        </CardContent>
      )}
    </Card>
  );
}
