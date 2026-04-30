import * as React from 'react';
import { Award, Heart, Recycle, type LucideIcon } from 'lucide-react';

import { cn } from '../utils/cn';
import { Badge } from './ui/badge';

export type ScoreBadgeVariant =
  | 'cps'
  | 'local-loop'
  | 'scout-bronze'
  | 'scout-silver'
  | 'scout-gold';

export interface ScoreBadgeProps {
  variant: ScoreBadgeVariant;
  /** Numeric score for cps / local-loop variants. Ignored for scout badges. */
  value?: number;
  className?: string;
}

const variantConfig: Record<
  ScoreBadgeVariant,
  { label: string; icon: LucideIcon; valuePrefix?: string; toneClass?: string }
> = {
  cps: { label: 'CPS', icon: Heart, valuePrefix: '' },
  'local-loop': { label: 'Local Loop', icon: Recycle, valuePrefix: '+' },
  'scout-bronze': {
    label: 'Bronze Scout',
    icon: Award,
    toneClass: 'bg-amber-700/10 text-amber-800 border-amber-700/30',
  },
  'scout-silver': {
    label: 'Silver Scout',
    icon: Award,
    toneClass: 'bg-zinc-400/15 text-zinc-700 border-zinc-400/40',
  },
  'scout-gold': {
    label: 'Gold Scout',
    icon: Award,
    toneClass: 'bg-yellow-400/15 text-yellow-800 border-yellow-500/40',
  },
};

/**
 * ScoreBadge renders one of the LocalChamp score families:
 *   - CPS (Community Participation Score) — numeric
 *   - Local Loop — numeric, rendered with `+` prefix to signal it's a modifier
 *   - Scout Badges (bronze / silver / gold) — qualitative, no numeric value
 *
 * Scout badges use tone-specific colors (amber/zinc/yellow) to evoke the
 * traditional medal hierarchy. CPS and Local Loop use the neutral `outline`
 * variant of the underlying Badge primitive.
 */
export function ScoreBadge({ variant, value, className }: ScoreBadgeProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const hasValue = (variant === 'cps' || variant === 'local-loop') && value != null;

  return (
    <Badge
      variant="outline"
      className={cn(config.toneClass, className)}
      aria-label={
        hasValue ? `${config.label} ${value}` : config.label
      }
    >
      <Icon className="h-3 w-3" aria-hidden />
      <span className="font-semibold">{config.label}</span>
      {hasValue && (
        <span className="font-normal opacity-80">
          {config.valuePrefix}
          {value}
        </span>
      )}
    </Badge>
  );
}
