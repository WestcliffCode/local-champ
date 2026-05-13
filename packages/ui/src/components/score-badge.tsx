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
  value?: number;
  className?: string;
}

const variantConfig: Record<
  ScoreBadgeVariant,
  { label: string; icon: LucideIcon; valuePrefix?: string; badgeVariant?: 'diamond' | 'sapphire' | 'emerald' | 'outline'; toneClass?: string }
> = {
  cps: { label: 'CPS', icon: Heart, valuePrefix: '', badgeVariant: 'diamond' },
  'local-loop': { label: 'Local Loop', icon: Recycle, valuePrefix: '+', badgeVariant: 'emerald' },
  'scout-bronze': {
    label: 'Bronze Scout',
    icon: Award,
    toneClass: 'bg-amber-700/15 text-amber-400 border-amber-600/30',
  },
  'scout-silver': {
    label: 'Silver Scout',
    icon: Award,
    toneClass: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  },
  'scout-gold': {
    label: 'Gold Scout',
    icon: Award,
    toneClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  },
};

export function ScoreBadge({ variant, value, className }: ScoreBadgeProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const hasValue = (variant === 'cps' || variant === 'local-loop') && value != null;

  return (
    <Badge
      variant={config.badgeVariant ?? 'outline'}
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
